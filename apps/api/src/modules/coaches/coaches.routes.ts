import { Router } from 'express'
import { CoachesController } from './coaches.controller.js'
import type { CoachesRepository } from './coaches.repository.js'
import { CoachesService } from './coaches.service.js'

export function createCoachesRouter(coachesRepository: CoachesRepository): Router {
  const router = Router()
  const coachesService = new CoachesService(coachesRepository)
  const coachesController = new CoachesController(coachesService)

  router.get('/health', coachesController.health)
  router.post('/', coachesController.create)
  router.get('/', coachesController.getCoaches)
  router.get('/:id', coachesController.getCoach)
  router.patch('/:id', coachesController.update)

  return router
}
