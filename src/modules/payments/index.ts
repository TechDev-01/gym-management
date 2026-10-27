import { env } from '../../config/env.js'
import { AppDataSource } from '../../database/data-source.js'
import { Membership } from '../memberships/membership.entity.js'
import { Subscription } from '../memberships/subscription.entity.js'
import { Payment } from './payment.entity.js'
import { StripeEvent } from './stripe-event.entity.js'
import { StripePaymentGateway } from './payment-gateway.js'
import { PaymentsController } from './payments.controller.js'
import { PaymentsRepository } from './payments.repository.js'
import { createPaymentsRouter } from './payments.routes.js'
import { PaymentsService } from './payments.service.js'

const paymentsService = new PaymentsService(
  new PaymentsRepository(
    AppDataSource.getRepository(Payment),
    AppDataSource.getRepository(Subscription),
    AppDataSource.getRepository(Membership),
    AppDataSource.getRepository(StripeEvent),
  ),
  new StripePaymentGateway(),
  env.GYM_TIMEZONE,
)

export const paymentGateway = paymentsService
export const paymentsRouter = createPaymentsRouter(new PaymentsController(paymentsService))
export default paymentsRouter
