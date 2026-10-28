import type { Client } from '../clients/types'
import type { Coach } from '../coaches/types'
import type { components } from '../../types/generated/api'

export const muscleGroups = [
  'CHEST',
  'BACK',
  'SHOULDERS',
  'ARMS',
  'LEGS',
  'GLUTES',
  'CORE',
  'CARDIO',
  'FULL_BODY',
] as const

export const routineLevels = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'] as const

export const assignmentStatuses = ['ACTIVE', 'COMPLETED', 'CANCELLED'] as const

export type MuscleGroup = (typeof muscleGroups)[number]
export type RoutineLevel = (typeof routineLevels)[number]
export type AssignmentStatus = (typeof assignmentStatuses)[number]

export type Exercise = components['schemas']['ExerciseResponse']

export type RoutineExercise = components['schemas']['RoutineExerciseResponse']

export type Routine = components['schemas']['RoutineResponse'] & { creator?: Coach }

export type ClientRoutine = components['schemas']['AssignmentResponse'] & {
  client?: Client
  routine?: Routine
  assignedBy?: Coach
}

export type ExerciseInput = components['schemas']['CreateExerciseRequest']

export type ExerciseUpdateInput = components['schemas']['UpdateExerciseRequest']

export type RoutineExerciseInput = components['schemas']['CreateRoutineExerciseRequest']

export type RoutineInput = components['schemas']['CreateRoutineRequest']

export type RoutineUpdateInput = components['schemas']['UpdateRoutineRequest']

export type AssignmentInput = components['schemas']['CreateAssignmentRequest']

export interface RoutineFilters {
  includeInactive?: boolean
}

export interface AssignmentFilters {
  clientId?: number
  status?: AssignmentStatus
}
