import { Router } from 'express'
import { AppDataSource } from '../../database/data-source.js'
import { authenticate } from '../../shared/middlewares/auth.middleware.js'
import { requireRole } from '../../shared/middlewares/role.middleware.js'
import { Client } from '../clients/client.entity.js'
import { ProgressRecord } from './progress-record.entity.js'
import { ProgressController } from './progress.controller.js'
import { TypeOrmProgressRepository } from './progress.repository.js'
import { ProgressService } from './progress.service.js'

export function createProgressRouter(): Router {
  const router = Router()
  const repository = new TypeOrmProgressRepository(
    AppDataSource.getRepository(ProgressRecord),
    AppDataSource.getRepository(Client),
  )
  const controller = new ProgressController(new ProgressService(repository))

  router.use(authenticate())
  router.get('/', controller.list)
  router.get('/:id', controller.get)
  router.post('/', requireRole('ADMIN', 'COACH'), controller.create)
  return router
}
