import { getNotificationsQueue, getReportsQueue } from './queues.js'
import type { NotificationJob, ReportJob } from './queues.js'

export interface ReportProcessor {
  generateReport(job: ReportJob): Promise<unknown>
}

export type ReportJobStatus = 'pending' | 'completed' | 'failed'

export interface ReportStatusSnapshot {
  jobId: string
  reportType: string
  status: ReportJobStatus
  requestedById: number
  requestedAt: string
  finishedAt: string | null
  result: unknown
  error: string | null
}

export interface ReportQueuePort {
  enqueue(job: ReportJob, jobId: string): Promise<{ id: string | undefined }>
  getStatus(jobId: string): Promise<ReportStatusSnapshot | null>
}

function mapJobState(state: string): ReportJobStatus {
  if (state === 'completed') {
    return 'completed'
  }

  if (state === 'failed') {
    return 'failed'
  }

  return 'pending'
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

export class ReportService implements ReportQueuePort {
  constructor(private readonly processor?: ReportProcessor) {}

  async enqueue(job: ReportJob, jobId: string): Promise<{ id: string | undefined }> {
    const queuedJob = await getReportsQueue().add(job.type, job, { jobId })
    return { id: queuedJob.id }
  }

  async getStatus(jobId: string): Promise<ReportStatusSnapshot | null> {
    const job = await getReportsQueue().getJob(jobId)

    if (!job) {
      return null
    }

    const state = await job.getState()
    const status = mapJobState(state)

    return {
      jobId: String(job.id ?? jobId),
      reportType: job.data.payload.reportType,
      status,
      requestedById: job.data.payload.requestedById,
      requestedAt: new Date(job.timestamp).toISOString(),
      finishedAt: job.finishedOn ? new Date(job.finishedOn).toISOString() : null,
      result: status === 'completed' ? (job.returnvalue ?? null) : null,
      error: status === 'failed' ? (job.failedReason ?? 'Report generation failed') : null,
    }
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
