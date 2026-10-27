import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { NotificationService } from '../../src/jobs/services.js'
import type { Membership } from '../../src/modules/memberships/membership.entity.js'
import { SubscriptionStatus, type Subscription } from '../../src/modules/memberships/subscription.entity.js'
import { PaymentStatus, type Payment } from '../../src/modules/payments/payment.entity.js'
import { PaymentsService, type PaymentsServiceRepository } from '../../src/modules/payments/payments.service.js'
import type { StripeGateway } from '../../src/modules/payments/payment-gateway.js'
import type { StripeEvent } from '../../src/modules/payments/stripe-event.entity.js'

const stripeGateway: StripeGateway = {
  createCheckoutSession: async () => ({ sessionId: 'cs_test', checkoutUrl: null }),
  expireCheckout: async () => {},
  constructEvent: () => {
    throw new Error('constructEvent is not used by queued webhook tests')
  },
}

function createPayment(overrides: Partial<Payment> = {}): Payment {
  return {
    id: 20,
    clientId: 7,
    subscriptionId: 10,
    status: PaymentStatus.PENDING,
    amount: 1000,
    currency: 'usd',
    refundedAmount: 0,
    stripeCheckoutSessionId: 'cs_test',
    stripePaymentIntentId: null,
    stripeInvoiceId: null,
    receiptUrl: null,
    recordedById: null,
    paidAt: null,
    createdAt: new Date(),
    ...overrides,
  } as Payment
}

function createRepository(overrides: Partial<PaymentsServiceRepository> = {}): PaymentsServiceRepository {
  const repository: PaymentsServiceRepository = {
    createPendingPayment: async () => createPayment(),
    findPendingBySubscription: async () => createPayment(),
    attachCheckoutSession: async () => {},
    findStripeEvent: async () => null,
    saveStripeEvent: async () => {},
    markStripeEventProcessed: async () => {},
    markStripeEventFailed: async () => {},
    findSubscriptionById: async () => ({
      id: 10,
      clientId: 7,
      membershipId: 1,
      status: SubscriptionStatus.PENDING,
    } as Subscription),
    findMembershipById: async () => ({
      id: 1,
      durationDays: 30,
    } as Membership),
    findById: async () => createPayment(),
    findByStripePaymentIntentId: async () => createPayment(),
    updatePayment: async () => {},
    activateSubscription: async () => {},
  }
  return Object.assign(repository, overrides)
}

function createNotificationService(events: string[]): NotificationService {
  return {
    enqueue: async (job) => { events.push(job.type) },
    process: async () => {},
  }
}

test('queued checkout webhook activates payment and subscription once', async () => {
  const updates: Array<{ id: number; input: Partial<Payment> }> = []
  const activated: Array<{ id: number; start: string; end: string }> = []
  const processed: string[] = []
  const repository = createRepository({
    findStripeEvent: async () => ({
      id: 'evt_checkout',
      type: 'checkout.session.completed',
      payload: {
        id: 'cs_test',
        metadata: { subscription_id: '10', payment_id: '20' },
        payment_intent: 'pi_test',
      },
      receivedAt: new Date(),
      processedAt: null,
      error: null,
    } satisfies StripeEvent),
    updatePayment: async (id, input) => { updates.push({ id, input }) },
    activateSubscription: async (id, start, end) => { activated.push({ id, start, end }) },
    markStripeEventProcessed: async (id) => { processed.push(id) },
  })
  const service = new PaymentsService(
    repository,
    stripeGateway,
    'UTC',
    createNotificationService([]),
  )

  await service.processQueuedWebhook('evt_checkout')

  assert.equal(updates[0]?.input.status, PaymentStatus.SUCCEEDED)
  assert.equal(updates[0]?.input.stripePaymentIntentId, 'pi_test')
  assert.equal(activated.length, 1)
  assert.equal(activated[0]?.id, 10)
  assert.equal(processed[0], 'evt_checkout')
})

test('already processed webhook is ignored for idempotency', async () => {
  let updateCalls = 0
  let processedCalls = 0
  const repository = createRepository({
    findStripeEvent: async () => ({
      id: 'evt_done',
      type: 'payment_intent.payment_failed',
      payload: { id: 'pi_test' },
      receivedAt: new Date(),
      processedAt: new Date(),
      error: null,
    } satisfies StripeEvent),
    updatePayment: async () => { updateCalls += 1 },
    markStripeEventProcessed: async () => { processedCalls += 1 },
  })

  await new PaymentsService(repository, stripeGateway).processQueuedWebhook('evt_done')

  assert.equal(updateCalls, 0)
  assert.equal(processedCalls, 0)
})

test('failed webhook is recorded and rethrown', async () => {
  let recordedError = ''
  const repository = createRepository({
    findStripeEvent: async () => ({
      id: 'evt_invalid',
      type: 'checkout.session.completed',
      payload: { metadata: {} },
      receivedAt: new Date(),
      processedAt: null,
      error: null,
    } satisfies StripeEvent),
    markStripeEventFailed: async (_id, error) => {
      recordedError = error instanceof Error ? error.message : ''
    },
  })

  await assert.rejects(
    () => new PaymentsService(repository, stripeGateway).processQueuedWebhook('evt_invalid'),
    { message: 'Stripe Checkout metadata is invalid' },
  )
  assert.equal(recordedError, 'Stripe Checkout metadata is invalid')
})
