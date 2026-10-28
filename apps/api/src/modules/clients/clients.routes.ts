import { Router } from 'express'
import { ClientsController } from './clients.controller.js'
import { authenticate } from '../../shared/middlewares/auth.middleware.js'
import { requireRole } from '../../shared/middlewares/role.middleware.js'
import type { ClientsRepository } from './clients.repository.js'
import { ClientsService } from './clients.service.js'

export function createClientsRouter(clientsRepository: ClientsRepository): Router {
  const router = Router()
  const clientsService = new ClientsService(clientsRepository)
  const clientsController = new ClientsController(clientsService)
  const authenticated = authenticate()
  const viewers = requireRole('ADMIN', 'RECEPTION', 'COACH')
  const managers = requireRole('ADMIN', 'RECEPTION')

  router.get('/health', clientsController.health)
  router.get('/', authenticated, viewers, clientsController.getClients)
  router.get('/:id', authenticated, viewers, clientsController.getClient)
  router.post('/', authenticated, managers, clientsController.create)
  router.patch('/:id', authenticated, managers, clientsController.update)

  return router
}
