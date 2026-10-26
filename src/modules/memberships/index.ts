import { AppDataSource } from '../../database/data-source.js'
import { env } from '../../config/env.js'
import { Client } from '../clients/client.entity.js'
import { Payment } from '../payments/payment.entity.js'
import { createPaymentWebhookHandler, TypeOrmPaymentGateway } from '../payments/payment-gateway.js'
import { StripeEvent } from '../payments/stripe-event.entity.js'
import { Membership } from './membership.entity.js'
import { TypeOrmMembershipsRepository } from './memberships.repository.js'
import { createMembershipsRouter, createSubscriptionsRouter } from './memberships.routes.js'
import { Subscription } from './subscription.entity.js'

const repository = new TypeOrmMembershipsRepository(
  AppDataSource.getRepository(Membership),
  AppDataSource.getRepository(Subscription),
  AppDataSource.getRepository(Client),
)
const paymentGateway = new TypeOrmPaymentGateway(
  AppDataSource.getRepository(Payment),
  AppDataSource.getRepository(Subscription),
  AppDataSource.getRepository(Membership),
  AppDataSource.getRepository(Client),
  AppDataSource.getRepository(StripeEvent),
)

export const membershipsRouter = createMembershipsRouter(repository, paymentGateway, env.GYM_TIMEZONE)
export const subscriptionsRouter = createSubscriptionsRouter(repository, paymentGateway, env.GYM_TIMEZONE)
export const paymentWebhookHandler = createPaymentWebhookHandler(paymentGateway)
export default membershipsRouter
