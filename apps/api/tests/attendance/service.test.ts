import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { Attendance } from '../../src/modules/attendance/attendance.entity.js'
import type { AttendanceRepository } from '../../src/modules/attendance/attendance.repository.js'
import { AttendanceService } from '../../src/modules/attendance/attendance.service.js'
import type { Client } from '../../src/modules/clients/client.entity.js'

const user = { id: '5', role: 'CLIENT', clientId: 7 }
const now = new Date('2026-10-28T15:00:00Z')

function createAttendance(overrides: Partial<Attendance> = {}): Attendance {
  return {
    id: 11,
    clientId: 7,
    subscriptionId: 20,
    checkInAt: now,
    checkOutAt: null,
    recordedById: 5,
    ...overrides,
  } as Attendance
}

function createRepository(overrides: Partial<AttendanceRepository> = {}): AttendanceRepository {
  return {
    findClient: async () => ({ id: 7, isActive: true } as Client),
    findActiveSubscription: async () => ({ id: 20, maxDaysPerWeek: null }),
    findOpenAttendance: async () => null,
    countWeeklyAttendanceDays: async () => 0,
    createAttendance: async (input) => createAttendance(input),
    findAttendance: async () => createAttendance(),
    closeAttendance: async (id, checkOutAt) => createAttendance({ id, checkOutAt }),
    list: async () => ({ items: [], total: 0 }),
    ...overrides,
  }
}

test('check-in accepts a request without a body for self service', async () => {
  const service = new AttendanceService(createRepository(), 'UTC', () => now)

  const result = await service.checkIn(undefined, user)

  assert.equal(result.clientId, 7)
  assert.equal(result.subscriptionId, 20)
})

test('check-in requires an active subscription', async () => {
  const repository = createRepository({
    findActiveSubscription: async () => null,
  })

  await assert.rejects(
    () => new AttendanceService(repository, 'UTC', () => now).checkIn({}, user),
    { message: 'Client does not have an active subscription' },
  )
})

test('check-in rejects an existing open attendance', async () => {
  const repository = createRepository({
    findOpenAttendance: async () => createAttendance(),
  })

  await assert.rejects(
    () => new AttendanceService(repository, 'UTC', () => now).checkIn({}, user),
    { message: 'Client already has an open attendance' },
  )
})

test('check-in enforces maxDaysPerWeek by distinct attendance days', async () => {
  let countCalls = 0
  const repository = createRepository({
    findActiveSubscription: async () => ({ id: 20, maxDaysPerWeek: 3 }),
    countWeeklyAttendanceDays: async () => {
      countCalls += 1
      return countCalls === 1 ? 3 : 0
    },
  })

  await assert.rejects(
    () => new AttendanceService(repository, 'UTC', () => now).checkIn({}, user),
    { message: 'Weekly attendance limit reached' },
  )
  assert.equal(countCalls, 2)
})

test('check-in allows another entry on a day already counted', async () => {
  const repository = createRepository({
    findActiveSubscription: async () => ({ id: 20, maxDaysPerWeek: 3 }),
    countWeeklyAttendanceDays: async (_clientId, start) =>
      start.getTime() === new Date('2026-10-28T00:00:00Z').getTime() ? 1 : 3,
  })

  const result = await new AttendanceService(repository, 'UTC', () => now).checkIn({}, user)

  assert.equal(result.clientId, 7)
  assert.equal(result.subscriptionId, 20)
})

test('client cannot check in for another client', async () => {
  await assert.rejects(
    () => new AttendanceService(createRepository(), 'UTC', () => now).checkIn({ clientId: 8 }, user),
    { message: 'Clients can only check in themselves' },
  )
})

test('checkout rejects a closed attendance', async () => {
  const repository = createRepository({
    findAttendance: async () => createAttendance({ checkOutAt: new Date('2026-10-28T16:00:00Z') }),
  })

  await assert.rejects(
    () => new AttendanceService(repository, 'UTC', () => now).checkOut(11, user),
    { message: 'Attendance is already closed' },
  )
})

test('client cannot checkout another client attendance', async () => {
  const repository = createRepository({
    findAttendance: async () => createAttendance({ clientId: 8 }),
  })

  await assert.rejects(
    () => new AttendanceService(repository, 'UTC', () => now).checkOut(11, user),
    { message: 'Forbidden' },
  )
})

test('checkout closes an open attendance', async () => {
  const repository = createRepository()

  const result = await new AttendanceService(repository, 'UTC', () => now).checkOut(11, user)

  assert.equal(result.id, 11)
  assert.equal(result.checkOutAt, now)
})

test('client history is restricted to its own client', async () => {
  let requestedClientId: number | undefined
  const repository = createRepository({
    list: async (filters) => {
      requestedClientId = filters.clientId
      return { items: [], total: 0 }
    },
  })

  const result = await new AttendanceService(repository).list({
    clientId: 8,
    page: 1,
    limit: 20,
  }, user)

  assert.equal(requestedClientId, 7)
  assert.deepEqual(result, { items: [], page: 1, limit: 20, total: 0 })
})
