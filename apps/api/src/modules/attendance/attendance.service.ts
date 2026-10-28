import { ConflictError } from '../../shared/errors/conflict.error.js'
import { ForbiddenError } from '../../shared/errors/forbidden.error.js'
import { NotFoundError } from '../../shared/errors/not-found.error.js'
import type { AttendanceRepository } from './attendance.repository.js'
import { checkInSchema } from './attendance.schema.js'
import type { AttendancePage } from './types.js'
import { toAttendanceResponse } from './types.js'

interface UserContext {
  id: string
  role: string
  clientId: number | null
}

export class AttendanceService {
  constructor(
    private readonly repository: AttendanceRepository,
    private readonly timezone = 'UTC',
    private readonly now = () => new Date(),
  ) {}

  async checkIn(input: unknown, user: UserContext): Promise<ReturnType<typeof toAttendanceResponse>> {
    const data = checkInSchema.parse(input ?? {})
    const clientId = user.role === 'CLIENT' ? user.clientId : data.clientId
    if (!clientId) throw new ConflictError('clientId is required')
    if (user.role === 'CLIENT' && data.clientId !== undefined && data.clientId !== user.clientId) {
      throw new ForbiddenError('Clients can only check in themselves')
    }

    const client = await this.repository.findClient(clientId)
    if (!client || !client.isActive) throw new NotFoundError('Active client not found')

    const localDate = this.localDate(this.now())
    const subscription = await this.repository.findActiveSubscription(clientId, localDate)
    if (!subscription) throw new ConflictError('Client does not have an active subscription')
    if (await this.repository.findOpenAttendance(clientId)) {
      throw new ConflictError('Client already has an open attendance')
    }

    if (subscription.maxDaysPerWeek !== null) {
      const { start, end } = this.weekBounds(localDate)
      const days = await this.repository.countWeeklyAttendanceDays(clientId, start, end, this.timezone)
      const alreadyAttendedToday = await this.repository.countWeeklyAttendanceDays(
        clientId,
        this.localDateToUtc(localDate),
        this.localDateToUtc(this.addDays(localDate, 1)),
        this.timezone,
      ) > 0
      if (!alreadyAttendedToday && days >= subscription.maxDaysPerWeek) {
        throw new ConflictError('Weekly attendance limit reached')
      }
    }

    return toAttendanceResponse(await this.repository.createAttendance({
      clientId,
      subscriptionId: subscription.id,
      recordedById: this.userId(user),
    }))
  }

  async checkOut(id: number, user: UserContext): Promise<ReturnType<typeof toAttendanceResponse>> {
    const attendance = await this.requireAttendance(id)
    this.assertAccess(attendance.clientId, user)
    if (attendance.checkOutAt) throw new ConflictError('Attendance is already closed')
    return toAttendanceResponse(await this.repository.closeAttendance(id, this.now()))
  }

  async list(filters: {
    clientId?: number
    from?: string
    to?: string
    open?: boolean
    page: number
    limit: number
  }, user: UserContext): Promise<AttendancePage> {
    const clientId = user.role === 'CLIENT' ? user.clientId ?? -1 : filters.clientId
    const result = await this.repository.list({
      clientId,
      from: filters.from ? this.localDateToUtc(filters.from) : undefined,
      to: filters.to ? this.localDateToUtc(this.addDays(filters.to, 1)) : undefined,
      open: filters.open,
      page: filters.page,
      limit: filters.limit,
    })
    return {
      items: result.items.map(toAttendanceResponse),
      page: filters.page,
      limit: filters.limit,
      total: result.total,
    }
  }

  private async requireAttendance(id: number) {
    const attendance = await this.repository.findAttendance(id)
    if (!attendance) throw new NotFoundError('Attendance not found')
    return attendance
  }

  private assertAccess(clientId: number, user: UserContext): void {
    if (user.role === 'CLIENT' && user.clientId !== clientId) throw new ForbiddenError()
  }

  private userId(user: UserContext): number | null {
    const id = Number(user.id)
    return Number.isInteger(id) && id > 0 ? id : null
  }

  private localDate(date: Date): string {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: this.timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(date)
    const values = Object.fromEntries(parts.map((part) => [part.type, part.value]))
    return `${values.year}-${values.month}-${values.day}`
  }

  private weekBounds(date: string): { start: Date; end: Date } {
    const value = new Date(`${date}T00:00:00Z`)
    const day = value.getUTCDay()
    const monday = this.addDays(date, day === 0 ? -6 : 1 - day)
    return { start: this.localDateToUtc(monday), end: this.localDateToUtc(this.addDays(monday, 7)) }
  }

  private localDateToUtc(date: string): Date {
    const candidate = new Date(`${date}T00:00:00Z`)
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: this.timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(candidate)
    const values = Object.fromEntries(parts.map((part) => [part.type, part.value]))
    const zonedAsUtc = Date.UTC(
      Number(values.year), Number(values.month) - 1, Number(values.day),
      Number(values.hour), Number(values.minute), Number(values.second),
    )
    return new Date(candidate.getTime() - (zonedAsUtc - candidate.getTime()))
  }

  private addDays(date: string, days: number): string {
    const value = new Date(`${date}T00:00:00Z`)
    value.setUTCDate(value.getUTCDate() + days)
    return value.toISOString().slice(0, 10)
  }
}
