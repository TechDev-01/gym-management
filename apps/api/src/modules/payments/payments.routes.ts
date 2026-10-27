import express, { Router } from 'express'
import type { PaymentsController } from './payments.controller.js'

export function createPaymentsRouter(controller: PaymentsController): Router {
  const router = Router()
  router.post('/webhook', express.raw({ type: 'application/json' }), controller.webhook)
  return router
}
