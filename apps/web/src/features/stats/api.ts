import { request } from '../../lib/http'
import { getDashboardStats } from '../dashboard/api'
import type {
  ReportRequestResponse,
  ReportStatusResponse,
  StatsData,
  StatsFilters,
} from './types'

export function getStats(filters: StatsFilters = {}): Promise<StatsData> {
  return getDashboardStats(filters)
}

export function requestReport(filters: StatsFilters = {}): Promise<ReportRequestResponse> {
  return request<ReportRequestResponse>('stats/reports', {
    method: 'POST',
    body: {
      reportType: 'dashboard-summary',
      ...filters,
    },
  })
}

export function getReportStatus(jobId: string): Promise<ReportStatusResponse> {
  return request<ReportStatusResponse>(`stats/reports/${encodeURIComponent(jobId)}`)
}
