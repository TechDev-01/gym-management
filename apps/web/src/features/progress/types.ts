export interface ProgressRecord {
  id: number
  clientId: number
  recordedById: number | null
  measuredAt: string
  weightKg: number | null
  heightCm: number | null
  bodyFatPct: number | null
  muscleKg: number | null
  chestCm: number | null
  waistCm: number | null
  hipCm: number | null
  armCm: number | null
  thighCm: number | null
  notes: string | null
}

export interface ProgressPage {
  items: ProgressRecord[]
  page: number
  limit: number
  total: number
}

export interface ProgressFilters {
  clientId?: number
  from?: string
  to?: string
  page?: number
  limit?: number
}

export interface ProgressInput {
  clientId?: number
  measuredAt: string
  weightKg?: number | null
  heightCm?: number | null
  bodyFatPct?: number | null
  muscleKg?: number | null
  chestCm?: number | null
  waistCm?: number | null
  hipCm?: number | null
  armCm?: number | null
  thighCm?: number | null
  notes?: string | null
}

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
