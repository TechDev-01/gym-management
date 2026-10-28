import { request } from '../../lib/http'
import type { DashboardFilters, DashboardStats } from './types'

export function getDashboardStats(filters: DashboardFilters = {}): Promise<DashboardStats> {
  const searchParams = new URLSearchParams()

  for (const [key, value] of Object.entries(filters)) {
    if (value) {
      searchParams.set(key, value)
    }
  }

  const query = searchParams.toString()
  return request<DashboardStats>(`stats/dashboard${query ? `?${query}` : ''}`)
}
