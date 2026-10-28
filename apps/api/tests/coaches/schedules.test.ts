import assert from 'node:assert/strict'
import express from 'express'
import jwt from 'jsonwebtoken'
import { test } from 'node:test'
import { ZodError } from 'zod'
import { ConflictError } from '../../src/shared/errors/conflict.error.js'
import { NotFoundError } from '../../src/shared/errors/not-found.error.js'
import type { CoachSchedule } from '../../src/modules/coaches/coach-schedule.entity.js'
import type { Coach } from '../../src/modules/coaches/coach.entity.js'
import type { CoachSchedulesRepository } from '../../src/modules/coaches/coach-schedules.repository.js'
import { CoachSchedulesService } from '../../src/modules/coaches/coach-schedules.service.js'
import type { CoachesRepository } from '../../src/modules/coaches/coaches.repository.js'
import { createCoachesRouter } from '../../src/modules/coaches/coaches.routes.js'
import { errorHandlerMiddleware } from '../../src/shared/middlewares/error-handler.middleware.js'

const secret = 'test-secret-with-at-least-32-characters'

interface TestUser {
  id: string
  role: 'ADMIN' | 'RECEPTION' | 'COACH' | 'CLIENT'
  coachId: number | null
}

const admin: TestUser = { id: 'user-1', role: 'ADMIN', coachId: null }
const coachUser: TestUser = { id: 'user-2', role: 'COACH', coachId: 1 }

function makeCoach(): Coach {
  return {
    id: 1,
    email: 'carlos@example.com',
    dni: '11111111',
    name: 'Carlos',
    lastName: 'Ruiz',
    phone: '555-4000',
    isActive: true,
  } as Coach
}

function makeSchedule(overrides: Partial<CoachSchedule> = {}): CoachSchedule {
  return {
    id: 1,
    coachId: 1,
    dayOfWeek: 1,
    startTime: '08:00:00',
    endTime: '16:00:00',
    ...overrides,
  } as CoachSchedule
}

function coachesRepository(exists = true): CoachesRepository {
  return {
    getModuleName: () => 'coaches',
    create: async () => makeCoach(),
    getCoaches: async () => [makeCoach()],
    getCoach: async () => (exists ? makeCoach() : null),
    updateCoaches: async () => makeCoach(),
    findByEmail: async () => null,
    findByDni: async () => null,
  }
}

interface MemorySchedulesRepository extends CoachSchedulesRepository {
  schedules: CoachSchedule[]
}

function schedulesRepository(
  initial: CoachSchedule[] = [makeSchedule()],
): MemorySchedulesRepository {
  let nextId = initial.reduce((max, item) => Math.max(max, item.id), 0) + 1
  const repository: MemorySchedulesRepository = {
    schedules: initial.map((schedule) => ({ ...schedule })),
    listByCoach: async (coachId) =>
      repository.schedules
        .filter((schedule) => schedule.coachId === coachId)
        .sort(
          (left, right) =>
            left.dayOfWeek - right.dayOfWeek ||
            left.startTime.localeCompare(right.startTime),
        ),
    listByCoachAndDay: async (coachId, dayOfWeek) =>
      repository.schedules.filter(
        (schedule) =>
          schedule.coachId === coachId && schedule.dayOfWeek === dayOfWeek,
      ),
    findById: async (coachId, scheduleId) =>
      repository.schedules.find(
        (schedule) =>
          schedule.coachId === coachId && schedule.id === scheduleId,
      ) ?? null,
    findBySlot: async (coachId, dayOfWeek, startTime) =>
      repository.schedules.find(
        (schedule) =>
          schedule.coachId === coachId &&
          schedule.dayOfWeek === dayOfWeek &&
          schedule.startTime.slice(0, 5) === startTime,
      ) ?? null,
    create: async (input) => {
      const schedule = makeSchedule({
        ...input,
        id: nextId,
        startTime: `${input.startTime}:00`,
        endTime: `${input.endTime}:00`,
      })
      nextId += 1
      repository.schedules.push(schedule)
      return schedule
    },
    update: async (scheduleId, input) => {
      const schedule = repository.schedules.find(
        (item) => item.id === scheduleId,
      )

      if (!schedule) {
        return null
      }

      Object.assign(schedule, input)
      return schedule
    },
    deleteById: async (scheduleId) => {
      const index = repository.schedules.findIndex(
        (schedule) => schedule.id === scheduleId,
      )

      if (index === -1) {
        return false
      }

      repository.schedules.splice(index, 1)
      return true
    },
  }

  return repository
}

function service(
  schedules: CoachSchedulesRepository = schedulesRepository(),
  coachExists = true,
): CoachSchedulesService {
  return new CoachSchedulesService(
    coachesRepository(coachExists),
    schedules,
  )
}

test('listSchedules returns normalized HH:mm times', async () => {
  const result = await service().listSchedules(1)

  assert.deepEqual(result, [
    {
      id: 1,
      coachId: 1,
      dayOfWeek: 1,
      startTime: '08:00',
      endTime: '16:00',
    },
  ])
})

test('listSchedules returns 404 when the coach does not exist', async () => {
  await assert.rejects(() => service(undefined, false).listSchedules(99), NotFoundError)
})

test('createSchedule rejects an overlapping slot', async () => {
  await assert.rejects(
    () =>
      service().createSchedule(1, {
        dayOfWeek: 1,
        startTime: '09:00',
        endTime: '10:00',
      }),
    (error: unknown) =>
      error instanceof ConflictError &&
      error.message === 'Coach schedule overlaps an existing slot',
  )
})

test('createSchedule accepts an adjacent slot', async () => {
  const result = await service().createSchedule(1, {
    dayOfWeek: 1,
    startTime: '16:00',
    endTime: '18:00',
  })

  assert.equal(result.startTime, '16:00')
  assert.equal(result.endTime, '18:00')
})

test('createSchedule rejects an invalid time range', async () => {
  await assert.rejects(
    () =>
      service().createSchedule(1, {
        dayOfWeek: 1,
        startTime: '18:00',
        endTime: '09:00',
      }),
    ZodError,
  )
})

test('updateSchedule validates the merged schedule', async () => {
  await assert.rejects(
    () => service().updateSchedule(1, 1, { startTime: '17:00' }),
    ZodError,
  )
})

test('updateSchedule rejects a slot that overlaps another schedule', async () => {
  const repository = schedulesRepository([
    makeSchedule(),
    makeSchedule({ id: 2, startTime: '18:00:00', endTime: '20:00:00' }),
  ])

  await assert.rejects(
    () => service(repository).updateSchedule(1, 2, { startTime: '15:00' }),
    (error: unknown) =>
      error instanceof ConflictError &&
      error.message === 'Coach schedule overlaps an existing slot',
  )
})

test('deleteSchedule removes an existing slot', async () => {
  const repository = schedulesRepository()

  await service(repository).deleteSchedule(1, 1)

  assert.equal(repository.schedules.length, 0)
})

test('deleteSchedule returns 404 for an unknown slot', async () => {
  await assert.rejects(
    () => service().deleteSchedule(1, 99),
    NotFoundError,
  )
})

async function request(
  user: TestUser | null,
  path: string,
  init: RequestInit = {},
  schedules: MemorySchedulesRepository = schedulesRepository(),
): Promise<Response> {
  process.env.JWT_SECRET = secret
  const app = express()
  app.use(express.json())
  app.use(
    '/coaches',
    createCoachesRouter(coachesRepository(), schedules),
  )
  app.use(errorHandlerMiddleware)
  const server = app.listen(0)
  const address = server.address()
  assert(address && typeof address === 'object')
  const headers = new Headers(init.headers)

  if (init.body) {
    headers.set('content-type', 'application/json')
  }

  if (user) {
    const token = jwt.sign(
      {
        sub: user.id,
        role: user.role,
        clientId: null,
        coachId: user.coachId,
      },
      secret,
    )
    headers.set('authorization', `Bearer ${token}`)
  }

  try {
    return await fetch(`http://127.0.0.1:${address.port}${path}`, {
      ...init,
      headers,
    })
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()))
    })
  }
}

test('GET /coaches/:id/schedules requires authentication', async () => {
  const response = await request(null, '/coaches/1/schedules')

  assert.equal(response.status, 401)
})

test('GET /coaches/:id/schedules returns the schedule for a coach', async () => {
  const response = await request(coachUser, '/coaches/1/schedules')

  assert.equal(response.status, 200)
  const body = (await response.json()) as Array<Record<string, unknown>>
  assert.equal(body[0]?.startTime, '08:00')
})

test('POST /coaches/:id/schedules is forbidden for coaches', async () => {
  const response = await request(coachUser, '/coaches/1/schedules', {
    method: 'POST',
    body: JSON.stringify({
      dayOfWeek: 2,
      startTime: '09:00',
      endTime: '10:00',
    }),
  })

  assert.equal(response.status, 403)
})

test('POST /coaches/:id/schedules creates a slot for staff', async () => {
  const response = await request(admin, '/coaches/1/schedules', {
    method: 'POST',
    body: JSON.stringify({
      dayOfWeek: 2,
      startTime: '09:00',
      endTime: '10:00',
    }),
  })

  assert.equal(response.status, 201)
  const body = (await response.json()) as Record<string, unknown>
  assert.equal(body.dayOfWeek, 2)
  assert.equal(body.startTime, '09:00')
})

test('POST /coaches/:id/schedules returns 409 for an overlapping slot', async () => {
  const response = await request(admin, '/coaches/1/schedules', {
    method: 'POST',
    body: JSON.stringify({
      dayOfWeek: 1,
      startTime: '12:00',
      endTime: '13:00',
    }),
  })

  assert.equal(response.status, 409)
})

test('PATCH /coaches/:id/schedules/:scheduleId updates a slot', async () => {
  const response = await request(admin, '/coaches/1/schedules/1', {
    method: 'PATCH',
    body: JSON.stringify({ endTime: '17:00' }),
  })

  assert.equal(response.status, 200)
  const body = (await response.json()) as Record<string, unknown>
  assert.equal(body.endTime, '17:00')
})

test('DELETE /coaches/:id/schedules/:scheduleId returns 204', async () => {
  const schedules = schedulesRepository()
  const response = await request(
    admin,
    '/coaches/1/schedules/1',
    { method: 'DELETE' },
    schedules,
  )

  assert.equal(response.status, 204)
  assert.equal(schedules.schedules.length, 0)
})
