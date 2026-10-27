import assert from 'node:assert/strict'
import express from 'express'
import jwt from 'jsonwebtoken'
import { test } from 'node:test'
import { createAuthRouter } from '../../src/modules/auth/auth.routes.js'
import type { AuthRepository } from '../../src/modules/auth/auth.repository.js'
import { AuthService } from '../../src/modules/auth/auth.service.js'
import { errorHandlerMiddleware } from '../../src/shared/middlewares/error-handler.middleware.js'

const secret = 'test-secret-with-at-least-32-characters'

function createRepository(): AuthRepository {
  return {
    findByEmail: async () => null,
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
  }
}

async function request(path: string, init?: RequestInit): Promise<Response> {
  const previousSecret = process.env.JWT_SECRET
  process.env.JWT_SECRET = secret
  const app = express()
  app.use(express.json())
  app.use('/auth', createAuthRouter(new AuthService(createRepository(), secret)))
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

test('login validates requests and returns 400 for malformed credentials', async () => {
  const response = await request('/auth/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: 'not-an-email', password: '' }),
  })

  assert.equal(response.status, 400)
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
  assert.deepEqual(await response.json(), { error: 'Missing bearer token' })
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
  assert.deepEqual(await response.json(), { error: 'Forbidden' })
})
