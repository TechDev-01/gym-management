import { useQuery } from '@tanstack/react-query'
import type { UserRole } from '../../types/navigation'
import { getDashboardStats } from './api'
import type { DashboardFilters } from './types'

const dashboardRoles: UserRole[] = ['ADMIN', 'RECEPTION']

export function canAccessDashboardStats(role: UserRole | undefined): boolean {
  return role !== undefined && dashboardRoles.includes(role)
}

export function useDashboardStats(role: UserRole | undefined, filters: DashboardFilters) {
  const enabled = canAccessDashboardStats(role)

  return useQuery({
    queryKey: ['dashboard-stats', filters],
    queryFn: () => getDashboardStats(filters),
    enabled,
  })
}
