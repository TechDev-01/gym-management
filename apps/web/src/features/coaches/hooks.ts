import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createCoach,
  createCoachSchedule,
  deleteCoachSchedule,
  getCoach,
  getCoachSchedules,
  getCoaches,
  updateCoach,
  updateCoachSchedule,
} from './api'
import type { CoachInput, CoachScheduleInput } from './types'

export const coachesQueryKey = ['coaches'] as const
export const coachSchedulesQueryKey = (coachId: number) =>
  [...coachesQueryKey, coachId, 'schedules'] as const

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

export function useCoachSchedules(coachId: number, enabled = true) {
  return useQuery({
    queryKey: coachSchedulesQueryKey(coachId),
    queryFn: () => getCoachSchedules(coachId),
    enabled: enabled && Number.isInteger(coachId) && coachId > 0,
  })
}

export function useCreateCoachSchedule(coachId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CoachScheduleInput) =>
      createCoachSchedule(coachId, input),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: coachSchedulesQueryKey(coachId),
      }),
  })
}

export function useUpdateCoachSchedule(coachId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      scheduleId,
      input,
    }: {
      scheduleId: number
      input: Partial<CoachScheduleInput>
    }) => updateCoachSchedule(coachId, scheduleId, input),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: coachSchedulesQueryKey(coachId),
      }),
  })
}

export function useDeleteCoachSchedule(coachId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (scheduleId: number) =>
      deleteCoachSchedule(coachId, scheduleId),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: coachSchedulesQueryKey(coachId),
      }),
  })
}
