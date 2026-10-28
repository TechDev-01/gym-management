import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createProgress, getProgress, getProgressRecord } from './api'
import type { ProgressFilters, ProgressInput } from './types'

export const progressQueryKey = ['progress'] as const

export function useProgress(filters: ProgressFilters = {}, enabled = true) {
  return useQuery({
    queryKey: [...progressQueryKey, filters],
    queryFn: () => getProgress(filters),
    enabled,
  })
}

export function useProgressRecord(id: number, enabled = true) {
  return useQuery({
    queryKey: [...progressQueryKey, 'record', id],
    queryFn: () => getProgressRecord(id),
    enabled: enabled && Number.isInteger(id) && id > 0,
  })
}

export function useCreateProgress() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: ProgressInput) => createProgress(input),
    onSuccess: (record) => {
      queryClient.invalidateQueries({ queryKey: progressQueryKey })
      queryClient.invalidateQueries({ queryKey: ['client-progress', record.clientId] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
    },
  })
}
