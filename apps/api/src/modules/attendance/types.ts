import type { Attendance } from './attendance.entity.js'

export interface AttendanceFilters {
  clientId?: number
  from?: Date
  to?: Date
  open?: boolean
  page: number
  limit: number
}

export interface AttendancePage {
  items: AttendanceResponse[]
  page: number
  limit: number
  total: number
}

export interface AttendanceResponse {
  id: number
  clientId: number
  subscriptionId: number
  checkInAt: Date
  checkOutAt: Date | null
  recordedById: number | null
}

export interface ActiveSubscriptionInfo {
  id: number
  maxDaysPerWeek: number | null
}

export function toAttendanceResponse(attendance: Attendance): AttendanceResponse {
  return {
    id: attendance.id,
    clientId: attendance.clientId,
    subscriptionId: attendance.subscriptionId,
    checkInAt: attendance.checkInAt,
    checkOutAt: attendance.checkOutAt,
    recordedById: attendance.recordedById,
  }
}
