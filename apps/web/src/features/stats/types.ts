import type { DashboardFilters, DashboardStats } from '../dashboard/types'

export type StatsFilters = DashboardFilters
export type StatsData = DashboardStats
export type ReportStatus = 'pending' | 'completed' | 'failed'

export interface ReportRequestResponse {
  jobId: string
}

export interface ReportStatusResponse {
  jobId: string
  reportType: string
  status: ReportStatus
  requestedAt: string | null
  finishedAt: string | null
  result: StatsData | null
  error: string | null
}
