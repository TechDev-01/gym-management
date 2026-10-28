import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import {
  addRoutineExercise,
  createAssignment,
  createExercise,
  createRoutine,
  deleteRoutineExercise,
  getAssignment,
  getAssignments,
  getExercises,
  getRoutine,
  getRoutines,
  setRoutineStatus,
  updateAssignmentStatus,
  updateExercise,
  updateRoutine,
  updateRoutineExercise,
} from './api'
import type {
  AssignmentFilters,
  AssignmentInput,
  AssignmentStatus,
  ExerciseInput,
  ExerciseUpdateInput,
  RoutineExerciseInput,
  RoutineFilters,
  RoutineInput,
  RoutineUpdateInput,
} from './types'

export const routinesQueryKey = ['routines'] as const
export const exercisesQueryKey = ['exercises'] as const
export const assignmentsQueryKey = ['routine-assignments'] as const

function invalidateRoutineData(queryClient: QueryClient, routineId?: number): void {
  queryClient.invalidateQueries({ queryKey: routinesQueryKey })

  if (routineId !== undefined) {
    queryClient.invalidateQueries({ queryKey: [...routinesQueryKey, routineId] })
  }

  queryClient.invalidateQueries({ queryKey: assignmentsQueryKey })
}

export function useExercises(enabled = true) {
  return useQuery({
    queryKey: exercisesQueryKey,
    queryFn: getExercises,
    enabled,
  })
}

export function useCreateExercise() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: ExerciseInput) => createExercise(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: exercisesQueryKey }),
  })
}

export function useUpdateExercise() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: ExerciseUpdateInput }) =>
      updateExercise(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: exercisesQueryKey })
      queryClient.invalidateQueries({ queryKey: routinesQueryKey })
    },
  })
}

export function useRoutines(filters: RoutineFilters = {}, enabled = true) {
  return useQuery({
    queryKey: [...routinesQueryKey, filters],
    queryFn: () => getRoutines(filters),
    enabled,
  })
}

export function useRoutine(id: number, enabled = true) {
  return useQuery({
    queryKey: [...routinesQueryKey, id],
    queryFn: () => getRoutine(id),
    enabled: enabled && Number.isInteger(id) && id > 0,
  })
}

export function useCreateRoutine() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: RoutineInput) => createRoutine(input),
    onSuccess: () => invalidateRoutineData(queryClient),
  })
}

export function useUpdateRoutine(id: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: RoutineUpdateInput) => updateRoutine(id, input),
    onSuccess: () => invalidateRoutineData(queryClient, id),
  })
}

export function useSetRoutineStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      setRoutineStatus(id, isActive),
    onSuccess: (_, variables) => invalidateRoutineData(queryClient, variables.id),
  })
}

export function useAddRoutineExercise(routineId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: RoutineExerciseInput) => addRoutineExercise(routineId, input),
    onSuccess: () => invalidateRoutineData(queryClient, routineId),
  })
}

export function useUpdateRoutineExercise(routineId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      routineExerciseId,
      input,
    }: {
      routineExerciseId: number
      input: Partial<RoutineExerciseInput>
    }) => updateRoutineExercise(routineId, routineExerciseId, input),
    onSuccess: () => invalidateRoutineData(queryClient, routineId),
  })
}

export function useDeleteRoutineExercise(routineId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (routineExerciseId: number) =>
      deleteRoutineExercise(routineId, routineExerciseId),
    onSuccess: () => invalidateRoutineData(queryClient, routineId),
  })
}

export function useAssignments(filters: AssignmentFilters = {}, enabled = true) {
  return useQuery({
    queryKey: [...assignmentsQueryKey, filters],
    queryFn: () => getAssignments(filters),
    enabled,
  })
}

export function useAssignment(id: number, enabled = true) {
  return useQuery({
    queryKey: [...assignmentsQueryKey, id],
    queryFn: () => getAssignment(id),
    enabled: enabled && Number.isInteger(id) && id > 0,
  })
}

export function useCreateAssignment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: AssignmentInput) => createAssignment(input),
    onSuccess: () => invalidateRoutineData(queryClient),
  })
}

export function useUpdateAssignmentStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: number
      status: Extract<AssignmentStatus, 'COMPLETED' | 'CANCELLED'>
    }) => updateAssignmentStatus(id, status),
    onSuccess: () => {
      invalidateRoutineData(queryClient)
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
    },
  })
}
