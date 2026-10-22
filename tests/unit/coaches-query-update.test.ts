import assert from 'node:assert/strict'
import express from 'express'
import { test } from 'node:test'
import { ZodError } from 'zod'
import { CoachesService } from '../../src/modules/coaches/coaches.service.js'
import { createCoachesRouter } from '../../src/modules/coaches/coaches.routes.js'
import type { CoachesRepository } from '../../src/modules/coaches/coaches.repository.js'
import type { Coach } from '../../src/modules/coaches/coach.entity.js'
import { errorHandlerMiddleware } from '../../src/shared/middlewares/error-handler.middleware.js'

function coach(overrides: Partial<Coach> = {}): Coach {
  return {
    id: 1,
    email: 'ana@example.com',
    dni: '12345678',
    name: 'Ana',
    lastName: 'Gomez',
    phone: '555-0100',
    isActive: true,
    ...overrides,
  } as Coach
}

function repository(initialCoach: Coach | null = coach()): CoachesRepository {
  let currentCoach = initialCoach

  return {
    getModuleName: () => 'coaches',
    getCoaches: async () => (currentCoach ? [currentCoach] : []),
    getCoach: async () => currentCoach,
    findByEmail: async (email) =>
      currentCoach?.email === email ? currentCoach : null,
    findByDni: async (dni) => (currentCoach?.dni === dni ? currentCoach : null),
    updateCoaches: async (_id, input) => {
      currentCoach = currentCoach
        ? coach({ ...currentCoach, ...input })
        : null
      return currentCoach
    },
  }
}

test('getCoaches returns all coaches', async () => {
  const service = new CoachesService(repository())

  const result = await service.getCoaches()

  assert.equal(result.length, 1)
  assert.equal(result[0]?.email, 'ana@example.com')
})

test('updateCoach updates allowed fields', async () => {
  const service = new CoachesService(repository())

  const result = await service.updateCoach(1, { name: 'Beatriz' })

  assert.equal(result.name, 'Beatriz')
})

test('updateCoach rejects a duplicate email', async () => {
  const existing = coach()
  const duplicate = coach({ id: 2, email: 'other@example.com' })
  const coachRepository = repository(existing)
  coachRepository.findByEmail = async (email) =>
    email === 'other@example.com' ? duplicate : null
  const service = new CoachesService(coachRepository)

  await assert.rejects(
    () => service.updateCoach(1, { email: 'other@example.com' }),
    { message: 'Email is already registered' },
  )
})

test('updateCoach rejects a duplicate DNI', async () => {
  const existing = coach()
  const duplicate = coach({ id: 2, dni: '87654321' })
  const coachRepository = repository(existing)
  coachRepository.findByDni = async (dni) =>
    dni === '87654321' ? duplicate : null
  const service = new CoachesService(coachRepository)

  await assert.rejects(
    () => service.updateCoach(1, { dni: '87654321' }),
    { message: 'DNI is already registered' },
  )
})

async function request(
  path: string,
  init: RequestInit | undefined = undefined,
  coachesRepository: CoachesRepository = repository(),
): Promise<Response> {
  const app = express()
  app.use(express.json())
  app.use('/coaches', createCoachesRouter(coachesRepository))
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
  }
}

test('GET /coaches returns 200 with the coaches', async () => {
  const response = await request('/coaches')

  assert.equal(response.status, 200)
  assert.equal((await response.json())[0].id, 1)
})

test('GET /coaches/:id returns 200 with the requested coach', async () => {
  const response = await request('/coaches/1')

  assert.equal(response.status, 200)
  assert.equal((await response.json()).id, 1)
})

test('GET /coaches/:id returns 400 for an invalid id', async () => {
  const response = await request('/coaches/not-a-number')

  assert.equal(response.status, 400)
})

test('PATCH /coaches/:id returns 200 for valid input', async () => {
  const response = await request('/coaches/1', {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ name: 'Beatriz' }),
  })

  assert.equal(response.status, 200)
  assert.equal((await response.json()).name, 'Beatriz')
})

test('PATCH /coaches/:id returns 409 for a duplicate email', async () => {
  const coachRepository = repository()
  coachRepository.findByEmail = async () => coach({ id: 2 })
  const response = await request('/coaches/1', {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: 'other@example.com' }),
  }, coachRepository)

  assert.equal(response.status, 409)
})

test('PATCH /coaches/:id returns 400 for an empty body', async () => {
  const response = await request('/coaches/1', {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({}),
  })

  assert.equal(response.status, 400)
})

test('PATCH /coaches/:id returns 400 for an invalid field', async () => {
  const response = await request('/coaches/1', {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: 'invalid' }),
  })

  assert.equal(response.status, 400)
})

test('service rejects an empty update body', async () => {
  const service = new CoachesService(repository())

  await assert.rejects(
    () => service.updateCoach(1, {}),
    (error: unknown) =>
      error instanceof ZodError &&
      error.issues[0]?.message === 'At least one field is required',
  )
})
