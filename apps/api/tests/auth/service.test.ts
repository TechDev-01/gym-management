import assert from 'node:assert/strict'
import bcrypt from 'bcrypt'
import { test } from 'node:test'
import type { AuthRepository, AuthUser } from '../../src/modules/auth/auth.repository.js'
import { AuthenticationError, AuthService } from '../../src/modules/auth/auth.service.js'
import { UserRole } from '../../src/modules/auth/app-user.entity.js'

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
    create: async (input) => createUser(input),
    updateLastLogin: async () => {},
    createRefreshToken: async () => ({ id: 1 }),
    findRefreshTokenByHash: async () => null,
    revokeRefreshToken: async () => {},
    revokeAllRefreshTokens: async () => {},
    ...overrides,
  }
}

test('authenticate rejects invalid credentials without updating login time', async () => {
  let updateCalls = 0
  const repository = createRepository({
    findByEmail: async () => createUser({
      passwordHash: await bcrypt.hash('correct-password', 4),
    }),
    updateLastLogin: async () => { updateCalls += 1 },
  })

  await assert.rejects(
    () => new AuthService(repository, 'test-secret').authenticate({
      email: 'admin@example.com',
      password: 'wrong-password',
    }),
    AuthenticationError,
  )
  assert.equal(updateCalls, 0)
})

test('authenticate returns JWT claims and updates last login', async () => {
  let updatedUserId = 0
  const repository = createRepository({
    findByEmail: async () => createUser({
      passwordHash: await bcrypt.hash('correct-password', 4),
      clientId: 7,
    }),
    updateLastLogin: async (id) => { updatedUserId = id },
  })

  const result = await new AuthService(repository, 'test-secret').authenticate({
    email: 'admin@example.com',
    password: 'correct-password',
  })

  assert.equal(updatedUserId, 1)
  assert.equal(result.user.role, 'ADMIN')
  assert.equal(result.user.clientId, 7)
  assert.ok(result.accessToken)
})

test('register hashes the password and rejects duplicate email', async () => {
  let createdInput: Parameters<NonNullable<AuthRepository['create']>>[0] | undefined
  const repository = createRepository({
    create: async (input) => {
      createdInput = input
      return createUser(input)
    },
  })

  await new AuthService(repository, 'test-secret').register({
    email: 'reception@example.com',
    password: 'strong-password',
    role: 'RECEPTION',
  })

  assert.equal(createdInput?.email, 'reception@example.com')
  assert.notEqual(createdInput?.passwordHash, 'strong-password')
  assert.equal(await bcrypt.compare('strong-password', createdInput?.passwordHash ?? ''), true)

  const duplicateRepository = createRepository({
    findByEmail: async () => createUser(),
  })
  await assert.rejects(
    () => new AuthService(duplicateRepository, 'test-secret').register({
      email: 'admin@example.com',
      password: 'strong-password',
      role: 'ADMIN',
    }),
    { message: 'Email is already registered' },
  )
})

interface StoredRefreshToken {
  id: number
  userId: number
  tokenHash: string
  expiresAt: Date
  revokedAt: Date | null
  replacedById: number | null
}

function createRefreshRepository(user: AuthUser = createUser()) {
  const tokens = new Map<number, StoredRefreshToken>()
  let nextId = 1

  const repository = createRepository({
    findByEmail: async () => null,
    findById: async (id) => (id === user.id ? user : null),
    createRefreshToken: async (input) => {
      const token: StoredRefreshToken = {
        id: nextId,
        userId: input.userId,
        tokenHash: input.tokenHash,
        expiresAt: input.expiresAt,
        revokedAt: null,
        replacedById: null,
      }
      nextId += 1
      tokens.set(token.id, token)
      return { id: token.id }
    },
    findRefreshTokenByHash: async (tokenHash) => {
      const token = [...tokens.values()].find((candidate) => candidate.tokenHash === tokenHash)
      return token
        ? {
            id: token.id,
            userId: token.userId,
            expiresAt: token.expiresAt,
            revokedAt: token.revokedAt,
          }
        : null
    },
    revokeRefreshToken: async (id, replacedById = null) => {
      const token = tokens.get(id)
      if (token) {
        token.revokedAt = new Date()
        token.replacedById = replacedById
      }
    },
    revokeAllRefreshTokens: async (userId) => {
      for (const token of tokens.values()) {
        if (token.userId === userId && !token.revokedAt) {
          token.revokedAt = new Date()
        }
      }
    },
  })

  return { repository, tokens }
}

test('refresh rotates the token and revokes the previous one', async () => {
  const { repository, tokens } = createRefreshRepository()
  const service = new AuthService(repository, 'test-secret')
  const session = await service.register({
    email: 'admin@example.com',
    password: 'strong-password',
    role: 'ADMIN',
  })

  assert.equal(tokens.size, 1)
  const first = [...tokens.values()][0]
  assert(first)

  const rotated = await service.refresh(session.refreshToken)

  assert.notEqual(rotated.refreshToken, session.refreshToken)
  assert.equal(tokens.size, 2)
  assert(first.revokedAt instanceof Date)
  const second = [...tokens.values()].find((token) => token.id !== first.id)
  assert(second)
  assert.equal(first.replacedById, second.id)
})

test('reusing a rotated refresh token revokes every session for the user', async () => {
  const { repository, tokens } = createRefreshRepository()
  const service = new AuthService(repository, 'test-secret')
  const session = await service.register({
    email: 'admin@example.com',
    password: 'strong-password',
    role: 'ADMIN',
  })
  const rotated = await service.refresh(session.refreshToken)

  await assert.rejects(
    () => service.refresh(session.refreshToken),
    AuthenticationError,
  )

  assert.equal([...tokens.values()].every((token) => token.revokedAt !== null), true)
  await assert.rejects(() => service.refresh(rotated.refreshToken), AuthenticationError)
})

test('logout revokes the current refresh token', async () => {
  const { repository, tokens } = createRefreshRepository()
  const service = new AuthService(repository, 'test-secret')
  const session = await service.register({
    email: 'admin@example.com',
    password: 'strong-password',
    role: 'ADMIN',
  })

  await service.logout(session.refreshToken)

  const token = [...tokens.values()][0]
  assert(token)
  assert(token.revokedAt instanceof Date)
  await assert.rejects(() => service.refresh(session.refreshToken), AuthenticationError)
})

test('refresh rejects an expired token and revokes it', async () => {
  let now = new Date('2026-11-17T12:00:00Z')
  const { repository, tokens } = createRefreshRepository()
  const service = new AuthService(repository, 'test-secret', '1h', 7, () => now)
  const session = await service.register({
    email: 'admin@example.com',
    password: 'strong-password',
    role: 'ADMIN',
  })

  now = new Date('2026-11-25T12:00:00Z')

  await assert.rejects(() => service.refresh(session.refreshToken), AuthenticationError)

  const token = [...tokens.values()][0]
  assert(token)
  assert(token.revokedAt instanceof Date)
})
