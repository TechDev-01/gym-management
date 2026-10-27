import { getNotificationsQueue, getReportsQueue } from './queues.js'
import type { NotificationJob, ReportJob } from './queues.js'

export class NotificationService {
  async enqueue(job: NotificationJob, jobId: string): Promise<void> {
    await getNotificationsQueue().add(job.type, job, { jobId })
  }

  async process(job: NotificationJob): Promise<void> {
    console.info('Notification event processed', {
      type: job.type,
      payload: job.payload,
    })
  }
}

export class ReportService {
  async enqueue(job: ReportJob, jobId: string): Promise<void> {
    await getReportsQueue().add(job.type, job, { jobId })
  }

  async process(job: ReportJob): Promise<void> {
    console.info('Report job processed', {
      type: job.type,
      payload: job.payload,
    })
  }
}
