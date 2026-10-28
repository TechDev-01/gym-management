import type { components } from '../../types/generated/api'

export type ProgressRecord = components['schemas']['ProgressResponse']

export type ProgressPage = components['schemas']['ProgressPageResponse']

export interface ProgressFilters {
  clientId?: number
  from?: string
  to?: string
  page?: number
  limit?: number
}

export type ProgressInput = components['schemas']['CreateProgressRequest']

export type ProgressMetricKey =
  | 'weightKg'
  | 'heightCm'
  | 'bodyFatPct'
  | 'muscleKg'
  | 'chestCm'
  | 'waistCm'
  | 'hipCm'
  | 'armCm'
  | 'thighCm'

export interface ProgressMetricDefinition {
  key: ProgressMetricKey
  label: string
  unit: string
  color: string
}

export const progressMetrics: ProgressMetricDefinition[] = [
  { key: 'weightKg', label: 'Peso', unit: 'kg', color: '#8d5cf6' },
  { key: 'heightCm', label: 'Altura', unit: 'cm', color: '#59c4df' },
  { key: 'bodyFatPct', label: 'Grasa corporal', unit: '%', color: '#f1a652' },
  { key: 'muscleKg', label: 'Músculo', unit: 'kg', color: '#55c791' },
  { key: 'chestCm', label: 'Pecho', unit: 'cm', color: '#aa7cff' },
  { key: 'waistCm', label: 'Cintura', unit: 'cm', color: '#f16f6f' },
  { key: 'hipCm', label: 'Cadera', unit: 'cm', color: '#59c4df' },
  { key: 'armCm', label: 'Brazo', unit: 'cm', color: '#55c791' },
  { key: 'thighCm', label: 'Muslo', unit: 'cm', color: '#aa7cff' },
]
