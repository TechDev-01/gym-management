import { Router } from 'express'
import { authenticate } from '../../shared/middlewares/auth.middleware.js'
import { requireRole } from '../../shared/middlewares/role.middleware.js'
import { RoutinesController } from './routines.controller.js'
import type { RoutinesRepository } from './routines.repository.js'
import { RoutinesService } from './routines.service.js'

export function createRoutinesRouter(repository: RoutinesRepository): Router {
  const router = Router()
  const controller = new RoutinesController(new RoutinesService(repository))
  const managers = requireRole('ADMIN', 'COACH')
  const assigners = requireRole('ADMIN', 'COACH')

  router.use(authenticate())
  router.get('/exercises', controller.listExercises)
  router.get('/exercises/:id', controller.getExercise)
  router.post('/exercises', managers, controller.createExercise)
  router.patch('/exercises/:id', managers, controller.updateExercise)

  router.get('/assignments', controller.listAssignments)
  router.get('/assignments/:id', controller.getAssignment)
  router.post('/assignments', assigners, controller.createAssignment)
  router.post('/assignments/:id/status', assigners, controller.updateAssignmentStatus)

  router.get('/', controller.listRoutines)
  router.get('/:id', controller.getRoutine)
  router.post('/', managers, controller.createRoutine)
  router.patch('/:id', managers, controller.updateRoutine)
  router.patch('/:id/status', managers, controller.setRoutineStatus)
  router.post('/:id/exercises', managers, controller.addRoutineExercise)
  router.patch('/:id/exercises/:routineExerciseId', managers, controller.updateRoutineExercise)
  router.delete('/:id/exercises/:routineExerciseId', managers, controller.deleteRoutineExercise)

  return router
}
