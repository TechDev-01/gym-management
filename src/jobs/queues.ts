import { Queue } from 'bullmq'
import { redisConnectionOptions } from '../config/redis.js'

export const QUEUE_NAMES = {
  notifications: 'notifications',
  reports: 'reports',
  stripeWebhooks: 'stripe-webhooks',
} as const

export type NotificationJob =
  | {
      type: 'payment-confirmed'
      payload: { paymentId: number; subscriptionId: number }
    }
  | {
      type: 'routine-assigned'
      payload: { assignmentId: number; clientId: number; routineId: number }
    }
  | {
      type: 'membership-expiring'
      payload: { subscriptionId: number; clientId: number; endDate: string }
    }
  | {
      type: 'membership-expiry-scan'
      payload: Record<string, never>
    }

export type ReportJob = {
  type: 'admin-report'
  payload: {
    reportType: string
    requestedById: number
    filters: Record<string, string | number | boolean>
  }
}

export type StripeWebhookJob = {
  eventId: string
}

const defaultJobOptions = {
  attempts: 3,
  backoff: { type: 'exponential' as const, delay: 1_000 },
  removeOnComplete: 100,
  removeOnFail: 500,
}

let notificationsQueue: Queue<NotificationJob> | undefined
let reportsQueue: Queue<ReportJob> | undefined
let stripeWebhooksQueue: Queue<StripeWebhookJob> | undefined

export function getNotificationsQueue(): Queue<NotificationJob> {
  notificationsQueue ??= new Queue<NotificationJob>(
    QUEUE_NAMES.notifications,
    { connection: redisConnectionOptions, defaultJobOptions },
  )
  return notificationsQueue
}

export function getReportsQueue(): Queue<ReportJob> {
  reportsQueue ??= new Queue<ReportJob>(
    QUEUE_NAMES.reports,
    { connection: redisConnectionOptions, defaultJobOptions },
  )
  return reportsQueue
}

export function getStripeWebhooksQueue(): Queue<StripeWebhookJob> {
  stripeWebhooksQueue ??= new Queue<StripeWebhookJob>(
    QUEUE_NAMES.stripeWebhooks,
    { connection: redisConnectionOptions, defaultJobOptions },
  )
  return stripeWebhooksQueue
}

export async function closeQueues(): Promise<void> {
  await Promise.all([
    notificationsQueue?.close(),
    reportsQueue?.close(),
    stripeWebhooksQueue?.close(),
  ])
}

export async function scheduleMembershipExpiry(timezone: string): Promise<void> {
  await getNotificationsQueue().upsertJobScheduler(
    'membership-expiry',
    { pattern: '0 0 * * *', tz: timezone },
    {
      name: 'membership-expiry-scan',
      data: { type: 'membership-expiry-scan', payload: {} },
    },
  )
}
