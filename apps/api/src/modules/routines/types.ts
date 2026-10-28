import type { AssignmentStatus, MuscleGroup, RoutineLevel } from './routine.enums.js'

export interface UserContext {
  id: string
  role: string
  clientId: number | null
  coachId: number | null
}

export interface CreateExerciseInput {
  name: string
  muscleGroup: MuscleGroup
  equipment?: string | null
  description?: string | null
}

export interface UpdateExerciseInput {
  name?: string
  muscleGroup?: MuscleGroup
  equipment?: string | null
  description?: string | null
}

export interface CreateRoutineInput {
  name: string
  description?: string | null
  level: RoutineLevel
  createdById?: number
  exercises?: CreateRoutineExerciseInput[]
}

export interface UpdateRoutineInput {
  name?: string
  description?: string | null
  level?: RoutineLevel
}

export interface CreateRoutineExerciseInput {
  exerciseId: number
  dayNumber: number
  position: number
  sets: number
  reps: number
  weightKg?: number | null
  restSeconds?: number | null
  notes?: string | null
}

export type UpdateRoutineExerciseInput = Partial<Omit<CreateRoutineExerciseInput, 'exerciseId'>> & {
  exerciseId?: number
}

export interface CreateAssignmentInput {
  clientId?: number
  routineId: number
  assignedById?: number
  startDate: string
  endDate?: string | null
  notes?: string | null
}

export interface RoutineFilters {
  includeInactive: boolean
  coachId?: number
}

export interface AssignmentFilters {
  clientId?: number
  status?: AssignmentStatus
}
