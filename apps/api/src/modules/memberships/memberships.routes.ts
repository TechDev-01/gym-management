import { Router } from 'express'
import { authenticate } from '../../shared/middlewares/auth.middleware.js'
import { requireRole } from '../../shared/middlewares/role.middleware.js'
import { MembershipsController } from './memberships.controller.js'
import type { MembershipsRepository } from './memberships.repository.js'
import { MembershipsService } from './memberships.service.js'
import type { PaymentGateway } from './types.js'

export function createMembershipsRouter(
  repository: MembershipsRepository,
  paymentGateway?: PaymentGateway,
  timezone = 'UTC',
): Router {
  const router = Router()
  const service = new MembershipsService(repository, paymentGateway, timezone)
  const controller = new MembershipsController(service)
  const staff = requireRole('ADMIN', 'RECEPTION')

  router.use(authenticate())
  router.get('/', requireRole('ADMIN', 'RECEPTION', 'CLIENT'), controller.listMemberships)
  router.post('/', staff, controller.createMembership)
  router.get('/:id', requireRole('ADMIN', 'RECEPTION', 'CLIENT'), controller.getMembership)
  router.patch('/:id', staff, controller.updateMembership)
  router.patch('/:id/status', requireRole('ADMIN'), controller.setMembershipStatus)
  router.post('/:id/subscriptions', requireRole('ADMIN', 'RECEPTION', 'CLIENT'), controller.createSubscription)

  return router
}

export function createSubscriptionsRouter(
  repository: MembershipsRepository,
  paymentGateway?: PaymentGateway,
  timezone = 'UTC',
): Router {
  const router = Router()
  const service = new MembershipsService(repository, paymentGateway, timezone)
  const controller = new MembershipsController(service)
  const staff = requireRole('ADMIN', 'RECEPTION')

  router.use(authenticate())
  router.get('/', requireRole('ADMIN', 'RECEPTION', 'CLIENT'), controller.listSubscriptions)
  router.get('/:id', requireRole('ADMIN', 'RECEPTION', 'CLIENT'), controller.getSubscription)
  router.post('/:id/cancel', staff, controller.cancelSubscription)
  router.post('/:id/payment-confirmation', staff, controller.confirmManualPayment)

  return router
}
