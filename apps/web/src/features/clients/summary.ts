import { request } from '../../lib/http'

export type SubscriptionStatus = 'PENDING' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED'

export interface ClientSubscription {
  id: number
  clientId: number
  membershipId: number
  status: SubscriptionStatus
  startDate: string | null
  endDate: string | null
  createdAt: string
}

export interface AttendanceRecord {
  id: number
  clientId: number
  subscriptionId: number
  checkInAt: string
  checkOutAt: string | null
  recordedById: number | null
}

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

export interface PaginatedResponse<T> {
  items: T[]
  page: number
  limit: number
  total: number
}

function buildPath(path: string, params: Record<string, string | number>): string {
  const searchParams = new URLSearchParams()

  for (const [key, value] of Object.entries(params)) {
    searchParams.set(key, String(value))
  }

  return `${path}?${searchParams.toString()}`
}

export function getClientSubscriptions(clientId: number): Promise<ClientSubscription[]> {
  return request<ClientSubscription[]>(buildPath('subscriptions', { clientId }))
}

export function getClientAttendance(
  clientId: number,
  limit = 5,
): Promise<PaginatedResponse<AttendanceRecord>> {
  return request<PaginatedResponse<AttendanceRecord>>(
    buildPath('attendance', { clientId, page: 1, limit }),
  )
}

export function getClientProgress(
  clientId: number,
  limit = 5,
): Promise<PaginatedResponse<ProgressRecord>> {
  return request<PaginatedResponse<ProgressRecord>>(
    buildPath('progress', { clientId, page: 1, limit }),
  )
}
