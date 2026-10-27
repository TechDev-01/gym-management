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
    create: async (input) => createUser(input),
    updateLastLogin: async () => {},
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
