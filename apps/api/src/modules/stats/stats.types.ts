export interface StatsPeriod {
  from: string
  to: string
}

export interface DashboardFilters extends StatsPeriod {
  timezone: string
}

export interface PaymentStatusCount {
  status: string
  count: number
  amount: number
}

export interface CoachUsage {
  coachId: number
  coachName: string
  routinesCreated: number
  routineAssignments: number
  progressRecords: number
}

export interface DashboardStats {
  period: StatsPeriod
  clients: {
    active: number
  }
  memberships: {
    active: number
    expired: number
  }
  revenue: {
    amount: number
    currency: string | null
  }
  attendance: {
    total: number
  }
  payments: PaymentStatusCount[]
  coachUsage: CoachUsage[]
}

export interface ReportRequest {
  reportType: 'dashboard-summary'
  requestedById: number
  filters: Record<string, string | number | boolean>
}
