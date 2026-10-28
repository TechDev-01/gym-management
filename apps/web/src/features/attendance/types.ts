import type { components } from '../../types/generated/api'

export type AttendanceRecord = components['schemas']['AttendanceResponse']

export type AttendancePage = components['schemas']['AttendancePageResponse']

export interface AttendanceFilters {
  clientId?: number
  from?: string
  to?: string
  open?: boolean
  page?: number
  limit?: number
}
