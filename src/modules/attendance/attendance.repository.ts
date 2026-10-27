import { IsNull, type Repository } from 'typeorm'
import { Attendance } from './attendance.entity.js'
import { Client } from '../clients/client.entity.js'
import { Subscription, SubscriptionStatus } from '../memberships/subscription.entity.js'
import type { ActiveSubscriptionInfo, AttendanceFilters } from './types.js'

export interface AttendanceRepository {
  findClient(id: number): Promise<Client | null>
  findActiveSubscription(clientId: number, date: string): Promise<ActiveSubscriptionInfo | null>
  findOpenAttendance(clientId: number): Promise<Attendance | null>
  countWeeklyAttendanceDays(clientId: number, start: Date, end: Date, timezone: string): Promise<number>
  createAttendance(input: { clientId: number; subscriptionId: number; recordedById: number | null }): Promise<Attendance>
  findAttendance(id: number): Promise<Attendance | null>
  closeAttendance(id: number, checkOutAt: Date): Promise<Attendance>
  list(filters: AttendanceFilters): Promise<{ items: Attendance[]; total: number }>
}

export class TypeOrmAttendanceRepository implements AttendanceRepository {
  constructor(
    private readonly attendanceRepository: Repository<Attendance>,
    private readonly clientRepository: Repository<Client>,
    private readonly subscriptionRepository: Repository<Subscription>,
  ) {}

  findClient(id: number): Promise<Client | null> {
    return this.clientRepository.findOneBy({ id })
  }

  async findActiveSubscription(clientId: number, date: string): Promise<ActiveSubscriptionInfo | null> {
    const subscription = await this.subscriptionRepository.createQueryBuilder('subscription')
      .innerJoin('subscription.membership', 'membership')
      .select('subscription.id', 'id')
      .addSelect('membership.maxDaysPerWeek', 'maxDaysPerWeek')
      .where('subscription.client_id = :clientId', { clientId })
      .andWhere('subscription.status = :status', { status: SubscriptionStatus.ACTIVE })
      .andWhere('subscription.start_date <= :date', { date })
      .andWhere('subscription.end_date >= :date', { date })
      .orderBy('subscription.end_date', 'DESC')
      .getRawOne<{ id: number; maxDaysPerWeek: number | null }>()

    return subscription
      ? { id: Number(subscription.id), maxDaysPerWeek: subscription.maxDaysPerWeek === null ? null : Number(subscription.maxDaysPerWeek) }
      : null
  }

  findOpenAttendance(clientId: number): Promise<Attendance | null> {
    return this.attendanceRepository.findOne({
      where: { clientId, checkOutAt: IsNull() },
      order: { checkInAt: 'DESC' },
    })
  }

  async countWeeklyAttendanceDays(
    clientId: number,
    start: Date,
    end: Date,
    timezone: string,
  ): Promise<number> {
    const result = await this.attendanceRepository.createQueryBuilder('attendance')
      .select('COUNT(DISTINCT ((attendance.check_in_at AT TIME ZONE :timezone)::date))', 'count')
      .where('attendance.client_id = :clientId', { clientId })
      .andWhere('attendance.check_in_at >= :start', { start })
      .andWhere('attendance.check_in_at < :end', { end })
      .setParameter('timezone', timezone)
      .getRawOne<{ count: string }>()
    return Number(result?.count ?? 0)
  }

  async createAttendance(input: {
    clientId: number
    subscriptionId: number
    recordedById: number | null
  }): Promise<Attendance> {
    return this.attendanceRepository.save(this.attendanceRepository.create(input))
  }

  findAttendance(id: number): Promise<Attendance | null> {
    return this.attendanceRepository.findOneBy({ id })
  }

  async closeAttendance(id: number, checkOutAt: Date): Promise<Attendance> {
    await this.attendanceRepository.update({ id }, { checkOutAt })
    const attendance = await this.findAttendance(id)
    if (!attendance) throw new Error('Attendance disappeared during checkout')
    return attendance
  }

  async list(filters: AttendanceFilters): Promise<{ items: Attendance[]; total: number }> {
    const query = this.attendanceRepository.createQueryBuilder('attendance')
      .orderBy('attendance.check_in_at', 'DESC')
      .skip((filters.page - 1) * filters.limit)
      .take(filters.limit)

    if (filters.clientId !== undefined) query.andWhere('attendance.client_id = :clientId', { clientId: filters.clientId })
    if (filters.from) query.andWhere('attendance.check_in_at >= :from', { from: filters.from })
    if (filters.to) query.andWhere('attendance.check_in_at < :to', { to: filters.to })
    if (filters.open !== undefined) {
      query.andWhere(filters.open ? 'attendance.check_out_at IS NULL' : 'attendance.check_out_at IS NOT NULL')
    }

    const [items, total] = await query.getManyAndCount()
    return { items, total }
  }
}
