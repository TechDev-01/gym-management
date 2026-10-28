import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createCoach, getCoach, getCoaches, updateCoach } from './api'
import type { CoachInput } from './types'

export const coachesQueryKey = ['coaches'] as const

export function useCoaches() {
  return useQuery({ queryKey: coachesQueryKey, queryFn: getCoaches })
}

export function useCoach(id: number, enabled = true) {
  return useQuery({
    queryKey: [...coachesQueryKey, id],
    queryFn: () => getCoach(id),
    enabled: enabled && Number.isInteger(id) && id > 0,
  })
}

export function useCreateCoach() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CoachInput) => createCoach(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: coachesQueryKey }),
  })
}

export function useUpdateCoach(id: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CoachInput) => updateCoach(id, input),
    onSuccess: (coach) => {
      queryClient.setQueryData([...coachesQueryKey, id], coach)
      queryClient.invalidateQueries({ queryKey: coachesQueryKey })
    },
  })
}
