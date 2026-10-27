import type { Repository } from 'typeorm'
import { Attendance } from '../attendance/attendance.entity.js'
import { Client } from '../clients/client.entity.js'
import { Coach } from '../coaches/coach.entity.js'
import { Subscription, SubscriptionStatus } from '../memberships/subscription.entity.js'
import { Payment, PaymentStatus } from '../payments/payment.entity.js'
import { ClientRoutine } from '../routines/client-routine.entity.js'
import { Routine } from '../routines/routine.entity.js'
import { ProgressRecord } from '../progress/progress-record.entity.js'
import type { CoachUsage, PaymentStatusCount } from './stats.types.js'

export interface StatsRepository {
  countActiveClients(): Promise<number>
  countSubscriptions(status: SubscriptionStatus): Promise<number>
  sumSuccessfulPayments(from: Date, to: Date): Promise<{ amount: number; currency: string | null }>
  countAttendance(from: Date, to: Date): Promise<number>
  summarizePayments(from: Date, to: Date): Promise<PaymentStatusCount[]>
  summarizeCoachUsage(from: Date, to: Date): Promise<CoachUsage[]>
}

export class TypeOrmStatsRepository implements StatsRepository {
  constructor(
    private readonly clientRepository: Repository<Client>,
    private readonly subscriptionRepository: Repository<Subscription>,
    private readonly paymentRepository: Repository<Payment>,
    private readonly attendanceRepository: Repository<Attendance>,
    private readonly coachRepository: Repository<Coach>,
    private readonly routineRepository: Repository<Routine>,
    private readonly assignmentRepository: Repository<ClientRoutine>,
    private readonly progressRepository: Repository<ProgressRecord>,
  ) {}

  countActiveClients(): Promise<number> {
    return this.clientRepository.countBy({ isActive: true })
  }

  countSubscriptions(status: SubscriptionStatus): Promise<number> {
    return this.subscriptionRepository.countBy({ status })
  }

  async sumSuccessfulPayments(from: Date, to: Date): Promise<{ amount: number; currency: string | null }> {
    const result = await this.paymentRepository.createQueryBuilder('payment')
      .select('COALESCE(SUM(payment.amount), 0)', 'amount')
      .addSelect('MIN(payment.currency)', 'currency')
      .where('payment.status = :status', { status: PaymentStatus.SUCCEEDED })
      .andWhere('payment.paid_at >= :from', { from })
      .andWhere('payment.paid_at < :to', { to })
      .getRawOne<{ amount: string; currency: string | null }>()

    return {
      amount: Number(result?.amount ?? 0),
      currency: result?.currency ?? null,
    }
  }

  countAttendance(from: Date, to: Date): Promise<number> {
    return this.attendanceRepository.createQueryBuilder('attendance')
      .where('attendance.check_in_at >= :from', { from })
      .andWhere('attendance.check_in_at < :to', { to })
      .getCount()
  }

  async summarizePayments(from: Date, to: Date): Promise<PaymentStatusCount[]> {
    const rows = await this.paymentRepository.createQueryBuilder('payment')
      .select('payment.status', 'status')
      .addSelect('COUNT(payment.id)', 'count')
      .addSelect('COALESCE(SUM(payment.amount), 0)', 'amount')
      .where('payment.created_at >= :from', { from })
      .andWhere('payment.created_at < :to', { to })
      .groupBy('payment.status')
      .orderBy('payment.status', 'ASC')
      .getRawMany<{ status: string; count: string; amount: string }>()

    return rows.map((row) => ({
      status: row.status,
      count: Number(row.count),
      amount: Number(row.amount),
    }))
  }

  async summarizeCoachUsage(from: Date, to: Date): Promise<CoachUsage[]> {
    const rows = await this.coachRepository.createQueryBuilder('coach')
      .select('coach.id', 'coachId')
      .addSelect(`CONCAT(coach.name, ' ', coach.last_name)`, 'coachName')
      .addSelect('(SELECT COUNT(routine.id) FROM routine routine WHERE routine.created_by = coach.id AND routine.created_at >= :from AND routine.created_at < :to)', 'routinesCreated')
      .addSelect('(SELECT COUNT(client_routine.id) FROM client_routine client_routine WHERE client_routine.assigned_by = coach.id AND client_routine.start_date >= :fromDate AND client_routine.start_date < :toDate)', 'routineAssignments')
      .addSelect('(SELECT COUNT(progress_record.id) FROM progress_record progress_record WHERE progress_record.recorded_by = coach.id AND progress_record.measured_at >= :fromDate AND progress_record.measured_at < :toDate)', 'progressRecords')
      .setParameters({ from, to, fromDate: from.toISOString().slice(0, 10), toDate: to.toISOString().slice(0, 10) })
      .orderBy('coach.id', 'ASC')
      .getRawMany<{
        coachId: string
        coachName: string
        routinesCreated: string
        routineAssignments: string
        progressRecords: string
      }>()

    return rows.map((row) => ({
      coachId: Number(row.coachId),
      coachName: row.coachName,
      routinesCreated: Number(row.routinesCreated),
      routineAssignments: Number(row.routineAssignments),
      progressRecords: Number(row.progressRecords),
    }))
  }
}
