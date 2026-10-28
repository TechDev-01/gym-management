import type {
  AssignmentStatus,
  MuscleGroup,
  RoutineLevel,
} from './types'

export const muscleGroupLabels: Record<MuscleGroup, string> = {
  CHEST: 'Pecho',
  BACK: 'Espalda',
  SHOULDERS: 'Hombros',
  ARMS: 'Brazos',
  LEGS: 'Piernas',
  GLUTES: 'Glúteos',
  CORE: 'Core',
  CARDIO: 'Cardio',
  FULL_BODY: 'Cuerpo completo',
}

export const routineLevelLabels: Record<RoutineLevel, string> = {
  BEGINNER: 'Principiante',
  INTERMEDIATE: 'Intermedio',
  ADVANCED: 'Avanzado',
}

export const assignmentStatusLabels: Record<AssignmentStatus, string> = {
  ACTIVE: 'Activa',
  COMPLETED: 'Completada',
  CANCELLED: 'Cancelada',
}

export function assignmentStatusTone(
  status: AssignmentStatus,
): 'success' | 'pending' | 'error' | 'info' {
  switch (status) {
    case 'ACTIVE':
      return 'success'
    case 'COMPLETED':
      return 'info'
    case 'CANCELLED':
      return 'error'
  }
}
