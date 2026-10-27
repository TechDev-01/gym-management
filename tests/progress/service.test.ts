import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { Client } from '../../src/modules/clients/client.entity.js'
import type { ProgressRecord } from '../../src/modules/progress/progress-record.entity.js'
import type { ProgressRepository } from '../../src/modules/progress/progress.repository.js'
import { ProgressService } from '../../src/modules/progress/progress.service.js'

const clientUser = { id: '5', role: 'CLIENT', clientId: 7, coachId: null }
const coachUser = { id: '9', role: 'COACH', clientId: null, coachId: 3 }

function createRecord(overrides: Partial<ProgressRecord> = {}): ProgressRecord {
  return {
    id: 11,
    clientId: 7,
    recordedById: 3,
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

test('coach can register progress for any active client', async () => {
  let receivedClientId: number | undefined
  let receivedCoachId: number | null | undefined
  const repository = createRepository({
    create: async (input) => {
      receivedClientId = input.clientId
      receivedCoachId = input.recordedById
      return createRecord(input)
    },
  })

  const result = await new ProgressService(repository).create({
    clientId: 7,
    measuredAt: '2026-10-28',
    weightKg: 80.5,
  }, coachUser)

  assert.equal(receivedClientId, 7)
  assert.equal(receivedCoachId, 3)
  assert.equal(result.weightKg, 80.5)
})

test('progress requires at least one measurement', async () => {
  await assert.rejects(
    () => new ProgressService(createRepository()).create({
      clientId: 7,
      measuredAt: '2026-10-28',
      notes: 'No measurements',
    }, coachUser),
    { name: 'ZodError' },
  )
})

test('client registration uses its own client and does not assign a coach', async () => {
  let receivedInput: { clientId: number; recordedById: number | null } | undefined
  const repository = createRepository({
    create: async (input) => {
      receivedInput = { clientId: input.clientId, recordedById: input.recordedById }
      return createRecord(input)
    },
  })

  await new ProgressService(repository).create({
    measuredAt: '2026-10-28',
    waistCm: 82,
  }, clientUser)

  assert.deepEqual(receivedInput, { clientId: 7, recordedById: null })
})

test('client history is restricted to its own client', async () => {
  let requestedClientId: number | undefined
  const repository = createRepository({
    list: async (filters) => {
      requestedClientId = filters.clientId
      return { items: [], total: 0 }
    },
  })

  const result = await new ProgressService(repository).list({ clientId: 8 }, clientUser)

  assert.equal(requestedClientId, 7)
  assert.deepEqual(result, { items: [], page: 1, limit: 20, total: 0 })
})

test('client cannot view another client progress record', async () => {
  const repository = createRepository({
    findById: async () => createRecord({ clientId: 8 }),
  })

  await assert.rejects(
    () => new ProgressService(repository).get(11, clientUser),
    { message: 'Forbidden' },
  )
})

test('progress values are returned as numbers', async () => {
  const result = await new ProgressService(createRepository()).get(11, coachUser)

  assert.equal(result.weightKg, 80.5)
  assert.equal(result.heightCm, null)
})
