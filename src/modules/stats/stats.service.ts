import { addDays, todayInTimezone } from '../../shared/dates.js'
import type { ReportJob } from '../../jobs/queues.js'
import { SubscriptionStatus } from '../memberships/subscription.entity.js'
import type { DashboardFilters, DashboardStats } from './stats.types.js'
import { dashboardQuerySchema, reportRequestSchema } from './stats.schemas.js'
import type { StatsRepository } from './stats.repository.js'

export class StatsService {
  constructor(
    private readonly repository: StatsRepository,
    private readonly timezone = 'UTC',
  ) {}

  async dashboard(input: unknown): Promise<DashboardStats> {
    const query = dashboardQuerySchema.parse(input)
    const filters = this.resolveFilters(query)
    const { from, to } = toDates(filters)

    const [
      activeClients,
      activeMemberships,
      expiredMemberships,
      revenue,
      attendance,
      payments,
      coachUsage,
    ] = await Promise.all([
      this.repository.countActiveClients(),
      this.repository.countSubscriptions(SubscriptionStatus.ACTIVE),
      this.repository.countSubscriptions(SubscriptionStatus.EXPIRED),
      this.repository.sumSuccessfulPayments(from, to),
      this.repository.countAttendance(from, to),
      this.repository.summarizePayments(from, to),
      this.repository.summarizeCoachUsage(from, to),
    ])

    return {
      period: { from: filters.from, to: filters.to },
      clients: { active: activeClients },
      memberships: { active: activeMemberships, expired: expiredMemberships },
      revenue,
      attendance: { total: attendance },
      payments,
      coachUsage,
    }
  }

  async generateReport(job: ReportJob): Promise<DashboardStats> {
    const input = reportRequestSchema.parse({
      reportType: job.payload.reportType,
      ...job.payload.filters,
    })
    return this.dashboard(input)
  }

  private resolveFilters(input: { from?: string; to?: string; timezone?: string }): DashboardFilters {
    const timezone = input.timezone ?? this.timezone
    const to = input.to ?? todayInTimezone(timezone)
    const from = input.from ?? addDays(to, -30)
    return { from, to, timezone }
  }
}

function toDates(filters: DashboardFilters): { from: Date; to: Date } {
  return {
    from: new Date(`${filters.from}T00:00:00.000Z`),
    to: new Date(`${filters.to}T00:00:00.000Z`),
  }
}
