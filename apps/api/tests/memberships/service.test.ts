import assert from 'node:assert/strict'
import { test } from 'node:test'
import { PaymentMethod } from '../../src/modules/payments/payment.entity.js'
import type { MembershipsRepository } from '../../src/modules/memberships/memberships.repository.js'
import { MembershipsService } from '../../src/modules/memberships/memberships.service.js'
import { SubscriptionStatus } from '../../src/modules/memberships/subscription.entity.js'
import type { PaymentGateway } from '../../src/modules/memberships/types.js'
import type { Membership } from '../../src/modules/memberships/membership.entity.js'
import type { Subscription } from '../../src/modules/memberships/subscription.entity.js'
import type { Client } from '../../src/modules/clients/client.entity.js'

function createMembership(overrides: Partial<Membership> = {}): Membership {
  return {
    id: 1,
    name: 'Monthly',
    description: null,
    durationDays: 30,
    maxDaysPerWeek: 3,
    priceAmount: 1000,
    currency: 'usd',
    stripeProductId: null,
    stripePriceId: null,
    isActive: true,
    ...overrides,
  } as Membership
}

function createSubscription(overrides: Partial<Subscription> = {}): Subscription {
  return {
    id: 10,
    clientId: 7,
    membershipId: 1,
    status: SubscriptionStatus.PENDING,
    startDate: null,
    endDate: null,
    stripeSubscriptionId: null,
    createdAt: new Date('2026-10-26T12:00:00Z'),
    ...overrides,
  } as Subscription
}

function createRepository(overrides: Partial<MembershipsRepository> = {}): MembershipsRepository {
  const membership = createMembership()
  const subscription = createSubscription()
  return {
    findMembershipById: async () => membership,
    findMembershipByName: async () => null,
    listMemberships: async () => [membership],
    countMembershipSubscriptions: async () => 0,
    createMembership: async (input) => createMembership(input),
    updateMembership: async (_id, input) => createMembership(input),
    setMembershipActive: async (_id, isActive) => createMembership({ isActive }),
    findClientById: async () => ({ id: 7, isActive: true } as Client),
    findSubscriptionById: async () => subscription,
    listSubscriptions: async () => [subscription],
    findClientSubscription: async () => null,
    createSubscription: async (input) => createSubscription(input),
    cancelSubscription: async () => createSubscription({ status: SubscriptionStatus.CANCELLED }),
    activateSubscription: async (_id, startDate, endDate) => createSubscription({
      status: SubscriptionStatus.ACTIVE,
      startDate,
      endDate,
    }),
    withTransaction: async (work) => work(createRepository(overrides)),
    ...overrides,
  }
}

function createGateway(overrides: Partial<PaymentGateway> = {}): PaymentGateway {
  return {
    createPendingPayment: async () => ({ paymentId: 20 }),
    createCheckoutSession: async () => ({
      sessionId: 'cs_test',
      checkoutUrl: 'https://checkout.test/session',
    }),
    attachCheckoutSession: async () => {},
    markPaymentFailed: async () => {},
    expirePendingCheckout: async () => {},
    confirmManualPayment: async () => {},
    ...overrides,
  }
}

test('rejects a new subscription when the client has an active one', async () => {
  const repository = createRepository({
    findClientSubscription: async (_clientId, status) =>
      status === SubscriptionStatus.ACTIVE ? createSubscription({ status }) : null,
  })

  await assert.rejects(
    () => new MembershipsService(repository).createSubscription({
      clientId: 7,
      membershipId: 1,
      method: PaymentMethod.CASH,
    }, { role: 'RECEPTION', clientId: null }),
    { message: 'Client already has an active subscription' },
  )
})

test('cancels a pending subscription before creating another one', async () => {
  let cancelledId: number | null = null
  let expiredId: number | null = null
  const repository = createRepository({
    findClientSubscription: async (_clientId, status) =>
      status === SubscriptionStatus.PENDING ? createSubscription({ id: 9, status }) : null,
    cancelSubscription: async (id) => {
      cancelledId = id
      return createSubscription({ id, status: SubscriptionStatus.CANCELLED })
    },
  })
  const gateway = createGateway({
    expirePendingCheckout: async (id) => { expiredId = id },
  })

  const result = await new MembershipsService(repository, gateway).createSubscription({
    clientId: 7,
    membershipId: 1,
    method: PaymentMethod.CARD,
  }, { role: 'RECEPTION', clientId: null })

  assert.equal(cancelledId, 9)
  assert.equal(expiredId, 9)
  assert.equal(result.checkoutUrl, 'https://checkout.test/session')
})

test('uses inclusive dates when manually activating a subscription', async () => {
  const repository = createRepository()
  const service = new MembershipsService(repository, createGateway(), 'UTC')

  const result = await service.confirmManualPayment(10, { role: 'RECEPTION', id: '2' })

  assert.equal(result.status, SubscriptionStatus.ACTIVE)
  assert.equal(result.startDate, new Intl.DateTimeFormat('en-CA', {
    timeZone: 'UTC',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date()))
  assert.match(result.endDate ?? '', /^\d{4}-\d{2}-\d{2}$/)
})

test('rejects price changes after a subscription exists', async () => {
  const repository = createRepository({ countMembershipSubscriptions: async () => 1 })

  await assert.rejects(
    () => new MembershipsService(repository).updateMembership(1, { priceAmount: 2000 }),
    { message: 'Pricing and duration cannot change after a subscription exists' },
  )
})

test('lists active subscriptions for staff without an undefined client filter', async () => {
  let receivedFilters: unknown = null
  const repository = createRepository({
    listSubscriptions: async (filters) => {
      receivedFilters = filters
      return [createSubscription({ status: SubscriptionStatus.ACTIVE })]
    },
  })

  const result = await new MembershipsService(repository).listSubscriptions(
    { status: SubscriptionStatus.ACTIVE },
    { role: 'ADMIN', clientId: null },
  )

  assert.deepEqual(receivedFilters, { status: SubscriptionStatus.ACTIVE })
  assert.equal(result.length, 1)
})

test('restricts subscription listings to the client own record', async () => {
  let receivedFilters: unknown = null
  const repository = createRepository({
    listSubscriptions: async (filters) => {
      receivedFilters = filters
      return [createSubscription({ status: SubscriptionStatus.ACTIVE })]
    },
  })

  await new MembershipsService(repository).listSubscriptions(
    {},
    { role: 'CLIENT', clientId: 7 },
  )

  assert.deepEqual(receivedFilters, { clientId: 7 })
})
