import { Router } from 'express'
import { authenticate } from '../../shared/middlewares/auth.middleware.js'
import { requireRole } from '../../shared/middlewares/role.middleware.js'
import { validate } from '../../shared/middlewares/validate.middleware.js'
import type { ReportQueuePort } from '../../jobs/services.js'
import { StatsController } from './stats.controller.js'
import {
  dashboardQuerySchema,
  reportParamsSchema,
  reportRequestSchema,
} from './stats.schemas.js'
import type { StatsService } from './stats.service.js'

export function createStatsRouter(service: StatsService, reportService: ReportQueuePort): Router {
  const router = Router()
  const controller = new StatsController(service, reportService)
  const staff = requireRole('ADMIN', 'RECEPTION')

  router.use(authenticate())
  router.get('/dashboard', staff, validate({ query: dashboardQuerySchema }), controller.dashboard)
  router.post('/reports', staff, validate({ body: reportRequestSchema }), controller.requestReport)
  router.get(
    '/reports/:jobId',
    staff,
    validate({ params: reportParamsSchema }),
    controller.reportStatus,
  )
  return router
}
