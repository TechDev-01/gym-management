export interface AttendanceRecord {
  id: number
  clientId: number
  subscriptionId: number
  checkInAt: string
  checkOutAt: string | null
  recordedById: number | null
}

export interface AttendancePage {
  items: AttendanceRecord[]
  page: number
  limit: number
  total: number
}

export interface AttendanceFilters {
  clientId?: number
  from?: string
  to?: string
  open?: boolean
  page?: number
  limit?: number
}
