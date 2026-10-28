import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { checkIn, checkOut, getAttendance } from './api'
import type { AttendanceFilters, AttendanceRecord } from './types'

export const attendanceQueryKey = ['attendance'] as const

export function useAttendance(filters: AttendanceFilters = {}, enabled = true) {
  return useQuery({
    queryKey: [...attendanceQueryKey, filters],
    queryFn: () => getAttendance(filters),
    enabled,
  })
}

function invalidateAttendanceRelated(
  queryClient: QueryClient,
  clientId: number | undefined,
): void {
  queryClient.invalidateQueries({ queryKey: attendanceQueryKey })
  queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })

  if (clientId !== undefined) {
    queryClient.invalidateQueries({ queryKey: ['client-attendance', clientId] })
  }
}

export function useCheckIn() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ clientId }: { clientId?: number }) => checkIn(clientId),
    onSuccess: (attendance: AttendanceRecord) => {
      invalidateAttendanceRelated(queryClient, attendance.clientId)
    },
  })
}

export function useCheckOut() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (attendanceId: number) => checkOut(attendanceId),
    onSuccess: (attendance: AttendanceRecord) => {
      invalidateAttendanceRelated(queryClient, attendance.clientId)
    },
  })
}
