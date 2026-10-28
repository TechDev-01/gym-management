import { request } from '../../lib/http'
import type {
  AssignmentFilters,
  AssignmentInput,
  AssignmentStatus,
  ClientRoutine,
  Exercise,
  ExerciseInput,
  ExerciseUpdateInput,
  Routine,
  RoutineExercise,
  RoutineExerciseInput,
  RoutineFilters,
  RoutineInput,
  RoutineUpdateInput,
} from './types'

function buildPath(
  path: string,
  filters: object,
): string {
  const searchParams = new URLSearchParams()

  for (const [key, value] of Object.entries(filters as Record<string, unknown>)) {
    if (value !== undefined && value !== '') {
      searchParams.set(key, String(value))
    }
  }

  const query = searchParams.toString()
  return query ? `${path}?${query}` : path
}

export function getExercises(): Promise<Exercise[]> {
  return request<Exercise[]>('routines/exercises')
}

export function getExercise(id: number): Promise<Exercise> {
  return request<Exercise>(`routines/exercises/${id}`)
}

export function createExercise(input: ExerciseInput): Promise<Exercise> {
  return request<Exercise>('routines/exercises', { method: 'POST', body: input })
}

export function updateExercise(id: number, input: ExerciseUpdateInput): Promise<Exercise> {
  return request<Exercise>(`routines/exercises/${id}`, { method: 'PATCH', body: input })
}

export function getRoutines(filters: RoutineFilters = {}): Promise<Routine[]> {
  return request<Routine[]>(
    buildPath('routines', {
      includeInactive: filters.includeInactive ? 'true' : undefined,
    }),
  )
}

export function getRoutine(id: number): Promise<Routine> {
  return request<Routine>(`routines/${id}`)
}

export function createRoutine(input: RoutineInput): Promise<Routine> {
  return request<Routine>('routines', { method: 'POST', body: input })
}

export function updateRoutine(id: number, input: RoutineUpdateInput): Promise<Routine> {
  return request<Routine>(`routines/${id}`, { method: 'PATCH', body: input })
}

export function setRoutineStatus(id: number, isActive: boolean): Promise<Routine> {
  return request<Routine>(`routines/${id}/status`, {
    method: 'PATCH',
    body: { isActive },
  })
}

export function addRoutineExercise(
  routineId: number,
  input: RoutineExerciseInput,
): Promise<RoutineExercise> {
  return request<RoutineExercise>(`routines/${routineId}/exercises`, {
    method: 'POST',
    body: input,
  })
}

export function updateRoutineExercise(
  routineId: number,
  routineExerciseId: number,
  input: Partial<RoutineExerciseInput>,
): Promise<RoutineExercise> {
  return request<RoutineExercise>(
    `routines/${routineId}/exercises/${routineExerciseId}`,
    { method: 'PATCH', body: input },
  )
}

export function deleteRoutineExercise(
  routineId: number,
  routineExerciseId: number,
): Promise<void> {
  return request<void>(`routines/${routineId}/exercises/${routineExerciseId}`, {
    method: 'DELETE',
  })
}

export function getAssignments(filters: AssignmentFilters = {}): Promise<ClientRoutine[]> {
  return request<ClientRoutine[]>(buildPath('routines/assignments', filters))
}

export function getAssignment(id: number): Promise<ClientRoutine> {
  return request<ClientRoutine>(`routines/assignments/${id}`)
}

export function createAssignment(input: AssignmentInput): Promise<ClientRoutine> {
  return request<ClientRoutine>('routines/assignments', {
    method: 'POST',
    body: input,
  })
}

export function updateAssignmentStatus(
  id: number,
  status: Extract<AssignmentStatus, 'COMPLETED' | 'CANCELLED'>,
): Promise<ClientRoutine> {
  return request<ClientRoutine>(`routines/assignments/${id}/status`, {
    method: 'POST',
    body: { status },
  })
}
