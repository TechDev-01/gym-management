import { Router } from 'express'
import { AppDataSource } from '../../database/data-source.js'
import { env } from '../../config/env.js'
import { authenticate } from '../../shared/middlewares/auth.middleware.js'
import { requireRole } from '../../shared/middlewares/role.middleware.js'
import { Client } from '../clients/client.entity.js'
import { Subscription } from '../memberships/subscription.entity.js'
import { Attendance } from './attendance.entity.js'
import { AttendanceController } from './attendance.controller.js'
import { TypeOrmAttendanceRepository } from './attendance.repository.js'
import { AttendanceService } from './attendance.service.js'

export function createAttendanceRouter(): Router {
  const router = Router()
  const repository = new TypeOrmAttendanceRepository(
    AppDataSource.getRepository(Attendance),
    AppDataSource.getRepository(Client),
    AppDataSource.getRepository(Subscription),
  )
  const controller = new AttendanceController(new AttendanceService(repository, env.GYM_TIMEZONE))

  router.use(authenticate())
  const allowedRoles = requireRole('ADMIN', 'RECEPTION', 'CLIENT')
  router.get('/', allowedRoles, controller.list)
  router.post('/check-in', allowedRoles, controller.checkIn)
  router.post('/:id/check-out', allowedRoles, controller.checkOut)
  return router
}
