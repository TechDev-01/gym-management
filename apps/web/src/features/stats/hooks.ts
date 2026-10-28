import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { UserRole } from '../../types/navigation'
import { canViewStats } from '../auth/permissions'
import { getReportStatus, getStats, requestReport } from './api'
import type { StatsFilters } from './types'

export const statsQueryKey = ['stats', 'dashboard'] as const
export const reportStatusQueryKey = ['stats', 'report'] as const

export function useStats(
  role: UserRole | undefined,
  filters: StatsFilters,
  enabled = true,
) {
  return useQuery({
    queryKey: [...statsQueryKey, filters],
    queryFn: () => getStats(filters),
    enabled: enabled && canViewStats(role),
  })
}

export function useRequestReport() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (filters: StatsFilters) => requestReport(filters),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: statsQueryKey })
    },
  })
}

export function useReportStatus(jobId: string) {
  return useQuery({
    queryKey: [...reportStatusQueryKey, jobId],
    queryFn: () => getReportStatus(jobId),
    enabled: jobId.length > 0,
    retry: false,
    refetchInterval: (query) =>
      query.state.data?.status === 'pending' ? 3_000 : false,
  })
}
