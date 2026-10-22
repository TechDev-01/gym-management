import { Router } from 'express'
import { ClientsController } from './clients.controller.js'
import type { ClientsRepository } from './clients.repository.js'
import { ClientsService } from './clients.service.js'

export function createClientsRouter(clientsRepository: ClientsRepository): Router {
  const router = Router()
  const clientsService = new ClientsService(clientsRepository)
  const clientsController = new ClientsController(clientsService)

  router.get('/health', clientsController.health)
  router.get('/', clientsController.getClients)
  router.get('/:id', clientsController.getClient)
  router.post('/', clientsController.create)
  router.patch('/:id', clientsController.update)

  return router
}
