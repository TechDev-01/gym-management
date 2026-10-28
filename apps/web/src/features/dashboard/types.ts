export interface DashboardFilters {
  from?: string
  to?: string
  timezone?: string
}

export interface PaymentStatusCount {
  status: string
  count: number
  amount: number
}

export interface CoachUsage {
  coachId: number
  coachName: string
  routinesCreated: number
  routineAssignments: number
  progressRecords: number
}

export type DashboardStats = components['schemas']['DashboardStatsResponse']
import type { components } from '../../types/generated/api'
