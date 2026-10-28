import { AppDataSource } from '../../database/data-source.js'
import { env } from '../../config/env.js'
import { Client } from '../clients/client.entity.js'
import { paymentGateway } from '../payments/index.js'
import { Membership } from './membership.entity.js'
import { TypeOrmMembershipsRepository } from './memberships.repository.js'
import { createMembershipsRouter, createSubscriptionsRouter } from './memberships.routes.js'
import { Subscription } from './subscription.entity.js'
import { MembershipExpiryService } from '../../jobs/membership-expiry.service.js'
import { NotificationService } from '../../jobs/services.js'

const repository = new TypeOrmMembershipsRepository(
  AppDataSource.getRepository(Membership),
  AppDataSource.getRepository(Subscription),
  AppDataSource.getRepository(Client),
)
export const membershipsRouter = createMembershipsRouter(repository, paymentGateway, env.GYM_TIMEZONE)
export const subscriptionsRouter = createSubscriptionsRouter(repository, paymentGateway, env.GYM_TIMEZONE)
export const membershipExpiryService = new MembershipExpiryService(
  repository,
  new NotificationService(),
  env.GYM_TIMEZONE,
)
export default membershipsRouter
