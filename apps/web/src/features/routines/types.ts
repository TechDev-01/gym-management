import type { Client } from '../clients/types'
import type { Coach } from '../coaches/types'

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

export interface Exercise {
  id: number
  name: string
  muscleGroup: MuscleGroup
  equipment: string | null
  description: string | null
}

export interface RoutineExercise {
  id: number
  routineId: number
  exerciseId: number
  dayNumber: number
  position: number
  sets: number
  reps: number
  weightKg: string | null
  restSeconds: number | null
  notes: string | null
  exercise?: Exercise
}

export interface Routine {
  id: number
  name: string
  description: string | null
  level: RoutineLevel
  createdById: number
  isActive: boolean
  createdAt: string
  creator?: Coach
  exercises?: RoutineExercise[]
}

export interface ClientRoutine {
  id: number
  clientId: number
  routineId: number
  assignedById: number
  status: AssignmentStatus
  startDate: string
  endDate: string | null
  notes: string | null
  client?: Client
  routine?: Routine
  assignedBy?: Coach
}

export interface ExerciseInput {
  name: string
  muscleGroup: MuscleGroup
  equipment?: string | null
  description?: string | null
}

export type ExerciseUpdateInput = Partial<ExerciseInput>

export interface RoutineExerciseInput {
  exerciseId: number
  dayNumber: number
  position: number
  sets: number
  reps: number
  weightKg?: number | null
  restSeconds?: number | null
  notes?: string | null
}

export interface RoutineInput {
  name: string
  description?: string | null
  level: RoutineLevel
  createdById?: number
  exercises?: RoutineExerciseInput[]
}

export type RoutineUpdateInput = Partial<Omit<RoutineInput, 'exercises'>>

export interface AssignmentInput {
  clientId?: number
  routineId: number
  assignedById?: number
  startDate: string
  endDate?: string | null
  notes?: string | null
}

export interface RoutineFilters {
  includeInactive?: boolean
}

export interface AssignmentFilters {
  clientId?: number
  status?: AssignmentStatus
}
