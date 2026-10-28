import { request } from '../../lib/http'
import type { AttendanceFilters, AttendancePage, AttendanceRecord } from './types'

function buildPath(path: string, filters: AttendanceFilters): string {
  const searchParams = new URLSearchParams()

  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== '') {
      searchParams.set(key, String(value))
    }
  }

  const query = searchParams.toString()
  return query ? `${path}?${query}` : path
}

export function getAttendance(filters: AttendanceFilters = {}): Promise<AttendancePage> {
  return request<AttendancePage>(buildPath('attendance', filters))
}

export function checkIn(clientId?: number): Promise<AttendanceRecord> {
  return request<AttendanceRecord>('attendance/check-in', {
    method: 'POST',
    ...(clientId === undefined ? {} : { body: { clientId } }),
  })
}

export function checkOut(id: number): Promise<AttendanceRecord> {
  return request<AttendanceRecord>(`attendance/${id}/check-out`, { method: 'POST' })
}
