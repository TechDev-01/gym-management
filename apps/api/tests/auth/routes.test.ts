import assert from 'node:assert/strict'
import bcrypt from 'bcrypt'
import cookieParser from 'cookie-parser'
import express from 'express'
import jwt from 'jsonwebtoken'
import { test } from 'node:test'
import { createAuthRouter } from '../../src/modules/auth/auth.routes.js'
import type { AuthRepository, AuthUser } from '../../src/modules/auth/auth.repository.js'
import { AuthService } from '../../src/modules/auth/auth.service.js'
import { UserRole } from '../../src/modules/auth/app-user.entity.js'
import { errorHandlerMiddleware } from '../../src/shared/middlewares/error-handler.middleware.js'

const secret = 'test-secret-with-at-least-32-characters'

function createUser(overrides: Partial<AuthUser> = {}): AuthUser {
  return {
    id: 1,
    email: 'admin@example.com',
    passwordHash: '',
    role: UserRole.ADMIN,
    clientId: null,
    coachId: null,
    isActive: true,
    lastLoginAt: null,
    ...overrides,
  }
}

function createRepository(overrides: Partial<AuthRepository> = {}): AuthRepository {
  return {
    findByEmail: async () => null,
    findById: async () => null,
    create: async (input) => ({
      id: 2,
      ...input,
      role: input.role,
      clientId: null,
      coachId: null,
      isActive: true,
      lastLoginAt: null,
    }),
    updateLastLogin: async () => {},
    createRefreshToken: async () => ({ id: 1 }),
    findRefreshTokenByHash: async () => null,
    revokeRefreshToken: async () => {},
    revokeAllRefreshTokens: async () => {},
    ...overrides,
  }
}

async function request(
  path: string,
  init?: RequestInit,
  repository: AuthRepository = createRepository(),
): Promise<Response> {
  const previousSecret = process.env.JWT_SECRET
  process.env.JWT_SECRET = secret
  const app = express()
  app.use(cookieParser())
  app.use(express.json())
  app.use('/auth', createAuthRouter(new AuthService(repository, secret)))
  app.use(errorHandlerMiddleware)
  const server = app.listen(0)
  const address = server.address()
  assert(address && typeof address === 'object')

  try {
    return await fetch(`http://127.0.0.1:${address.port}${path}`, init)
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()))
    })
    if (previousSecret === undefined) {
      delete process.env.JWT_SECRET
    } else {
      process.env.JWT_SECRET = previousSecret
    }
  }
}

test('login validates requests and returns 422 for malformed credentials', async () => {
  const response = await request('/auth/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: 'not-an-email', password: '' }),
  })

  assert.equal(response.status, 422)
  const result = await response.json()
  assert.equal(result.error, 'Invalid request')
  assert.equal(Array.isArray(result.issues), true)
})

test('register requires an ADMIN bearer token', async () => {
  const response = await request('/auth/register', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      email: 'reception@example.com',
      password: 'strong-password',
      role: 'RECEPTION',
    }),
  })

  assert.equal(response.status, 401)
  const body = await response.json()
  assert.equal(body.error, 'Missing bearer token')
  assert.equal(body.code, 'UNAUTHORIZED')
  assert.equal(typeof body.requestId, 'string')
})

test('register rejects a non-admin bearer token', async () => {
  const token = jwt.sign({
    sub: '1',
    role: 'RECEPTION',
    clientId: null,
    coachId: null,
  }, secret)
  const response = await request('/auth/register', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${token}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      email: 'reception@example.com',
      password: 'strong-password',
      role: 'RECEPTION',
    }),
  })

  assert.equal(response.status, 403)
  const body = await response.json()
  assert.equal(body.error, 'Forbidden')
  assert.equal(body.code, 'FORBIDDEN')
})

test('login rejects a malformed JSON body with 400 and a stable error code', async () => {
  const response = await request('/auth/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: '{',
  })

  assert.equal(response.status, 400)
  const body = await response.json()
  assert.equal(body.error, 'Malformed JSON body')
  assert.equal(body.code, 'INVALID_JSON')
  assert.equal(typeof body.requestId, 'string')
  assert.equal(response.headers.get('x-request-id'), body.requestId)
})

test('login is rate limited per IP and email', async () => {
  let lastResponse: Response | null = null

  for (let attempt = 0; attempt < 11; attempt += 1) {
    lastResponse = await request('/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'brute-force@example.com', password: 'wrong-password' }),
    })
  }

  assert(lastResponse)
  assert.equal(lastResponse.status, 429)
  const body = await lastResponse.json()
  assert.equal(body.code, 'RATE_LIMITED')
  assert.equal(typeof lastResponse.headers.get('retry-after'), 'string')
})

test('login sets an httpOnly refresh cookie without exposing the refresh token', async () => {
  const user = createUser({ passwordHash: await bcrypt.hash('correct-password', 4) })
  const response = await request('/auth/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: user.email, password: 'correct-password' }),
  }, createRepository({ findByEmail: async () => user }))

  assert.equal(response.status, 200)
  const cookie = response.headers.get('set-cookie') ?? ''
  assert.match(cookie, /gym_refresh_token=/)
  assert.match(cookie, /HttpOnly/i)
  assert.match(cookie, /Path=\/api\/v1\/auth/)
  assert.match(cookie, /SameSite=Strict/i)

  const body = await response.json()
  assert.ok(body.accessToken)
  assert.equal(body.refreshToken, undefined)
})

test('refresh without a cookie returns 401 and clears the refresh cookie', async () => {
  const response = await request('/auth/refresh', { method: 'POST' })

  assert.equal(response.status, 401)
  assert.match(response.headers.get('set-cookie') ?? '', /gym_refresh_token=;/)
})

test('logout revokes the session and clears the refresh cookie', async () => {
  let revokedTokenHash: string | null = null
  const user = createUser({ passwordHash: await bcrypt.hash('correct-password', 4) })
  const repository = createRepository({
    findByEmail: async () => user,
    findRefreshTokenByHash: async () => ({
      id: 5,
      userId: user.id,
      expiresAt: new Date(Date.now() + 60_000),
      revokedAt: null,
    }),
    revokeRefreshToken: async () => {
      revokedTokenHash = 'revoked'
    },
  })

  const login = await request('/auth/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: user.email, password: 'correct-password' }),
  }, repository)
  const cookie = (login.headers.get('set-cookie') ?? '').split(';')[0] ?? ''
  assert(cookie.startsWith('gym_refresh_token='))

  const response = await request('/auth/logout', {
    method: 'POST',
    headers: { cookie },
  }, repository)

  assert.equal(response.status, 204)
  assert.equal(revokedTokenHash, 'revoked')
  assert.match(response.headers.get('set-cookie') ?? '', /gym_refresh_token=;/)
})
