import type { NextFunction, Request, Response } from 'express'
import type { ReportService } from '../../jobs/services.js'
import type { StatsService } from './stats.service.js'

export class StatsController {
  constructor(
    private readonly service: StatsService,
    private readonly reportService: ReportService,
  ) {}

  dashboard = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      response.json(await this.service.dashboard(request.query))
    } catch (error: unknown) {
      next(error)
    }
  }

  requestReport = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      const requestedById = Number(request.user!.id)
      const job = await this.reportService.enqueue({
        type: 'admin-report',
        payload: {
          reportType: request.body.reportType,
          requestedById,
          filters: {
            ...(request.body.from ? { from: request.body.from } : {}),
            ...(request.body.to ? { to: request.body.to } : {}),
            ...(request.body.timezone ? { timezone: request.body.timezone } : {}),
          },
        },
      }, `admin-report-${requestedById}-${Date.now()}`)
      response.status(202).json({ jobId: job.id })
    } catch (error: unknown) {
      next(error)
    }
  }
}
