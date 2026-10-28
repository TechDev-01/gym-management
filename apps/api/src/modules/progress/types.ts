import type { ProgressRecord } from './progress-record.entity.js'

export interface UserContext {
  id: string
  role: string
  clientId: number | null
  coachId: number | null
}

export interface ProgressFilters {
  clientId?: number
  from?: string
  to?: string
  page: number
  limit: number
}

export interface CreateProgressInput {
  clientId: number
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

export interface ProgressPage {
  items: ReturnType<typeof toProgressResponse>[]
  page: number
  limit: number
  total: number
}

export function toProgressResponse(record: ProgressRecord) {
  return {
    id: record.id,
    clientId: record.clientId,
    recordedById: record.recordedById,
    measuredAt: record.measuredAt,
    weightKg: toNumber(record.weightKg),
    heightCm: toNumber(record.heightCm),
    bodyFatPct: toNumber(record.bodyFatPct),
    muscleKg: toNumber(record.muscleKg),
    chestCm: toNumber(record.chestCm),
    waistCm: toNumber(record.waistCm),
    hipCm: toNumber(record.hipCm),
    armCm: toNumber(record.armCm),
    thighCm: toNumber(record.thighCm),
    notes: record.notes,
  }
}

function toNumber(value: string | null): number | null {
  return value === null ? null : Number(value)
}
