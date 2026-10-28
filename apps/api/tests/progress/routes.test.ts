import assert from 'node:assert/strict'
import express from 'express'
import jwt from 'jsonwebtoken'
import { test } from 'node:test'
import type { Client } from '../../src/modules/clients/client.entity.js'
import type { ProgressRecord } from '../../src/modules/progress/progress-record.entity.js'
import type { ProgressRepository } from '../../src/modules/progress/progress.repository.js'
import { createProgressRouter } from '../../src/modules/progress/progress.routes.js'
import { ProgressService } from '../../src/modules/progress/progress.service.js'
import { errorHandlerMiddleware } from '../../src/shared/middlewares/error-handler.middleware.js'

const secret = 'test-secret-with-at-least-32-characters'
const clientUser = { id: '5', role: 'CLIENT', clientId: 7, coachId: null }

function createRecord(overrides: Partial<ProgressRecord> = {}): ProgressRecord {
  return {
    id: 11,
    clientId: 7,
    recordedById: null,
    measuredAt: '2026-10-28',
    weightKg: '80.50',
    heightCm: null,
    bodyFatPct: null,
    muscleKg: null,
    chestCm: null,
    waistCm: null,
    hipCm: null,
    armCm: null,
    thighCm: null,
    notes: null,
    ...overrides,
  } as ProgressRecord
}

function createRepository(overrides: Partial<ProgressRepository> = {}): ProgressRepository {
  return {
    findClient: async () => ({ id: 7, isActive: true } as Client),
    create: async (input) => createRecord(input),
    findById: async () => createRecord(),
    list: async () => ({ items: [], total: 0 }),
    ...overrides,
  }
}

async function request(
  service: ProgressService,
  path: string,
  init: RequestInit,
): Promise<Response> {
  const previousSecret = process.env.JWT_SECRET
  process.env.JWT_SECRET = secret
  const app = express()
  app.use(express.json())
  app.use('/progress', createProgressRouter(service))
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

function authorization(user: typeof clientUser): string {
  return `Bearer ${jwt.sign(
    { sub: user.id, role: user.role, clientId: user.clientId, coachId: user.coachId },
    secret,
  )}`
}

test('a client can register its own progress through the HTTP route', async () => {
  let receivedClientId: number | undefined
  const service = new ProgressService(createRepository({
    create: async (input) => {
      receivedClientId = input.clientId
      return createRecord(input)
    },
  }))

  const response = await request(service, '/progress', {
    method: 'POST',
    headers: {
      authorization: authorization(clientUser),
      'content-type': 'application/json',
    },
    body: JSON.stringify({ clientId: 99, measuredAt: '2026-10-28', weightKg: 80.5 }),
  })

  assert.equal(response.status, 201)
  const body = await response.json()
  assert.equal(body.clientId, 7)
  assert.equal(body.recordedById, null)
  assert.equal(body.weightKg, 80.5)
  assert.equal(receivedClientId, 7)
})

test('a client cannot register progress for another client', async () => {
  const service = new ProgressService(createRepository())

  const response = await request(service, '/progress', {
    method: 'POST',
    headers: {
      authorization: authorization(clientUser),
      'content-type': 'application/json',
    },
    body: JSON.stringify({ clientId: 42, measuredAt: '2026-10-28', waistCm: 82 }),
  })

  assert.equal(response.status, 201)
  assert.equal((await response.json()).clientId, 7)
})
