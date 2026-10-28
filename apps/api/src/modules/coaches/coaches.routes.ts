import { Router } from 'express'
import { authenticate } from '../../shared/middlewares/auth.middleware.js'
import { requireRole } from '../../shared/middlewares/role.middleware.js'
import { CoachSchedulesController } from './coach-schedules.controller.js'
import type { CoachSchedulesRepository } from './coach-schedules.repository.js'
import { CoachSchedulesService } from './coach-schedules.service.js'
import { CoachesController } from './coaches.controller.js'
import type { CoachesRepository } from './coaches.repository.js'
import { CoachesService } from './coaches.service.js'

export function createCoachesRouter(
  coachesRepository: CoachesRepository,
  schedulesRepository: CoachSchedulesRepository,
): Router {
  const router = Router()
  const coachesService = new CoachesService(coachesRepository)
  const coachesController = new CoachesController(coachesService)
  const schedulesService = new CoachSchedulesService(
    coachesRepository,
    schedulesRepository,
  )
  const schedulesController = new CoachSchedulesController(schedulesService)
  const authenticated = authenticate()
  const viewers = requireRole('ADMIN', 'RECEPTION', 'COACH')
  const managers = requireRole('ADMIN', 'RECEPTION')

  router.get('/health', coachesController.health)
  router.post('/', authenticated, managers, coachesController.create)
  router.get('/', authenticated, viewers, coachesController.getCoaches)
  router.get(
    '/:coachId/schedules',
    authenticated,
    viewers,
    schedulesController.list,
  )
  router.post(
    '/:coachId/schedules',
    authenticated,
    managers,
    schedulesController.create,
  )
  router.patch(
    '/:coachId/schedules/:scheduleId',
    authenticated,
    managers,
    schedulesController.update,
  )
  router.delete(
    '/:coachId/schedules/:scheduleId',
    authenticated,
    managers,
    schedulesController.remove,
  )
  router.get('/:id', authenticated, viewers, coachesController.getCoach)
  router.patch('/:id', authenticated, managers, coachesController.update)

  return router
}
