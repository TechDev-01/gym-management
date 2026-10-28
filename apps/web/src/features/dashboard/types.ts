export interface DashboardFilters {
  from?: string
  to?: string
  timezone?: string
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
  period: {
    from: string
    to: string
  }
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
