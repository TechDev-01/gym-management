import type { DashboardFilters, DashboardStats } from '../dashboard/types'
import type { components } from '../../types/generated/api'

export type StatsFilters = DashboardFilters
export type StatsData = DashboardStats
export type ReportStatus = components['schemas']['ReportStatusResponse']['status']

export type ReportRequestResponse = components['schemas']['ReportRequestResponse']

export type ReportStatusResponse = components['schemas']['ReportStatusResponse']
