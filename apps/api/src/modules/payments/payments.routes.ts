import express, { Router } from 'express'
import { authenticate } from '../../shared/middlewares/auth.middleware.js'
import { requireRole } from '../../shared/middlewares/role.middleware.js'
import type { PaymentsController } from './payments.controller.js'

export function createPaymentsRouter(controller: PaymentsController): Router {
  const router = Router()
  const staff = requireRole('ADMIN', 'RECEPTION')

  router.get('/', authenticate(), staff, controller.list)
  router.get('/:id', authenticate(), staff, controller.get)
  router.post('/webhook', express.raw({ type: 'application/json' }), controller.webhook)
  return router
}
