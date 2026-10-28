import { getNotificationsQueue, getReportsQueue } from './queues.js'
import type { NotificationJob, ReportJob } from './queues.js'

export interface ReportProcessor {
  generateReport(job: ReportJob): Promise<unknown>
}

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
  constructor(private readonly processor?: ReportProcessor) {}

  async enqueue(job: ReportJob, jobId: string): Promise<{ id: string | undefined }> {
    const queuedJob = await getReportsQueue().add(job.type, job, { jobId })
    return { id: queuedJob.id }
  }

  async process(job: ReportJob): Promise<unknown> {
    if (!this.processor) {
      console.info('Report job processed', {
        type: job.type,
        payload: job.payload,
      })
      return
    }
    return this.processor.generateReport(job)
  }
}
