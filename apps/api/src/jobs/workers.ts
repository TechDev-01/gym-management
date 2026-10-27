import { Worker, type Job } from 'bullmq'
import { redisConnectionOptions } from '../config/redis.js'
import type { PaymentsService } from '../modules/payments/payments.service.js'
import {
  QUEUE_NAMES,
  type NotificationJob,
  type ReportJob,
  type StripeWebhookJob,
} from './queues.js'
import { NotificationService, ReportService } from './services.js'
import { MembershipExpiryService } from './membership-expiry.service.js'

export type ApplicationWorkers = {
  notifications: Worker<NotificationJob>
  reports: Worker<ReportJob>
  stripeWebhooks: Worker<StripeWebhookJob>
}

export function createWorkers(
  paymentsService: PaymentsService,
  notificationService = new NotificationService(),
  reportService = new ReportService(),
  membershipExpiryService?: MembershipExpiryService,
): ApplicationWorkers {
  const notifications = new Worker<NotificationJob>(
    QUEUE_NAMES.notifications,
    async (job) => {
      if (job.data.type === 'membership-expiry-scan') {
        if (!membershipExpiryService) throw new Error('Membership expiry service is not configured')
        await membershipExpiryService.processDailyScan()
        return
      }
      await notificationService.process(job.data)
    },
    { connection: redisConnectionOptions },
  )

  const reports = new Worker<ReportJob>(
    QUEUE_NAMES.reports,
    (job) => reportService.process(job.data),
    { connection: redisConnectionOptions },
  )

  const stripeWebhooks = new Worker<StripeWebhookJob>(
    QUEUE_NAMES.stripeWebhooks,
    (job) => paymentsService.processQueuedWebhook(job.data.eventId),
    { connection: redisConnectionOptions },
  )

  for (const worker of [notifications, reports, stripeWebhooks]) {
    worker.on('failed', (job: Job | undefined, error: Error) => {
      console.error(`Job failed on ${worker.name}`, {
        jobId: job?.id,
        error: error.message,
      })
    })
  }

  return { notifications, reports, stripeWebhooks }
}

export async function closeWorkers(workers: ApplicationWorkers): Promise<void> {
  await Promise.all(Object.values(workers).map((worker) => worker.close()))
}
