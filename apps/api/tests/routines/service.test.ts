import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { Client } from '../../src/modules/clients/client.entity.js'
import type { Coach } from '../../src/modules/coaches/coach.entity.js'
import type { ClientRoutine } from '../../src/modules/routines/client-routine.entity.js'
import type { Exercise } from '../../src/modules/routines/exercise.entity.js'
import type { Routine } from '../../src/modules/routines/routine.entity.js'
import type { RoutinesRepository } from '../../src/modules/routines/routines.repository.js'
import { RoutinesService } from '../../src/modules/routines/routines.service.js'

const coachUser = { id: '10', role: 'COACH', clientId: null, coachId: 3 }
const clientUser = { id: '20', role: 'CLIENT', clientId: 7, coachId: null }

function routine(overrides: Partial<Routine> = {}): Routine {
  return { id: 1, name: 'Upper body', description: null, level: 'BEGINNER', createdById: 3, isActive: true, createdAt: new Date(), ...overrides } as Routine
}

function assignment(overrides: Partial<ClientRoutine> = {}): ClientRoutine {
  return { id: 4, clientId: 7, routineId: 1, assignedById: 3, status: 'ACTIVE', startDate: '2026-10-27', endDate: null, notes: null, ...overrides } as ClientRoutine
}

function repository(overrides: Partial<RoutinesRepository> = {}): RoutinesRepository {
  return {
    findExercise: async () => ({ id: 2 } as Exercise),
    findExerciseByName: async () => null,
    listExercises: async () => [],
    createExercise: async (input) => ({ id: 2, ...input } as Exercise),
    updateExercise: async (id, input) => ({ id, ...input } as Exercise),
    findRoutine: async () => routine(),
    listRoutines: async () => [routine()],
    createRoutine: async (input, coachId) => routine({ ...input, createdById: coachId }),
    updateRoutine: async (id, input) => routine({ id, ...input }),
    setRoutineActive: async (id, isActive) => routine({ id, isActive }),
    addRoutineExercise: async (routineId, input) => ({ id: 5, routineId, ...input } as never),
    findRoutineExercise: async () => null,
    updateRoutineExercise: async (id, input) => ({ id, ...input } as never),
    deleteRoutineExercise: async () => {},
    findClient: async () => ({ id: 7, isActive: true } as Client),
    findCoach: async () => ({ id: 3, isActive: true } as Coach),
    findAssignment: async () => assignment(),
    findActiveAssignment: async () => null,
    listAssignments: async () => [assignment()],
    createAssignment: async (input) => assignment(input),
    updateAssignmentStatus: async (id, status, endDate) => assignment({ id, status, endDate }),
    withTransaction: async (work) => work(repository()),
    ...overrides,
  }
}

test('routine creation validates referenced exercises', async () => {
  const service = new RoutinesService(repository({
    findExercise: async () => null,
  }))

  await assert.rejects(
    () => service.createRoutine({
      name: 'Upper body',
      level: 'BEGINNER',
      exercises: [{ exerciseId: 99, dayNumber: 1, position: 1, sets: 3, reps: 10 }],
    }, coachUser),
    { message: 'Exercise not found' },
  )
})

test('coach cannot modify another coach routine', async () => {
  const service = new RoutinesService(repository({
    findRoutine: async () => routine({ createdById: 8 }),
  }))

  await assert.rejects(
    () => service.updateRoutine(1, { name: 'Changed' }, coachUser),
    { message: 'Forbidden' },
  )
})

test('a client can only list its own assignments', async () => {
  let requestedClientId: number | undefined
  const service = new RoutinesService(repository({
    listAssignments: async (filters) => {
      requestedClientId = filters.clientId
      return []
    },
  }))

  await service.listAssignments({ clientId: 99 }, clientUser)

  assert.equal(requestedClientId, 7)
})

test('a client cannot receive a second active routine', async () => {
  const service = new RoutinesService(repository({
    findActiveAssignment: async () => assignment(),
  }))

  await assert.rejects(
    () => service.createAssignment({ routineId: 1, startDate: '2026-10-27' }, clientUser),
    { message: 'Client already has an active routine' },
  )
})
