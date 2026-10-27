import Stripe from 'stripe'
import type { EntityManager } from 'typeorm'
import { ConflictError } from '../../shared/errors/conflict.error.js'
import { PaymentGatewayError } from '../../shared/errors/payment-gateway.error.js'
import type { CheckoutSessionInput, PaymentGateway, PendingPaymentInput } from '../memberships/types.js'
import { PaymentStatus } from './payment.entity.js'
import { StripePaymentGateway } from './payment-gateway.js'
import { PaymentsRepository } from './payments.repository.js'

export class PaymentsService implements PaymentGateway {
  constructor(
    private readonly repository: PaymentsRepository,
    private readonly stripeGateway: StripePaymentGateway,
    private readonly timezone = 'UTC',
  ) {}

  async createPendingPayment(manager: EntityManager, input: PendingPaymentInput): Promise<{ paymentId: number }> {
    const payment = await this.repository.createPendingPayment(manager, input)
    return { paymentId: payment.id }
  }

  createCheckoutSession(input: CheckoutSessionInput) {
    return this.stripeGateway.createCheckoutSession(input)
  }

  async attachCheckoutSession(paymentId: number, sessionId: string): Promise<void> {
    try {
      await this.repository.attachCheckoutSession(paymentId, sessionId)
    } catch {
      throw new PaymentGatewayError('Checkout was created but could not be linked to the payment')
    }
  }

  async markPaymentFailed(paymentId: number): Promise<void> {
    await this.repository.updatePayment(paymentId, { status: PaymentStatus.FAILED })
  }

  async expirePendingCheckout(subscriptionId: number): Promise<void> {
    const payment = await this.repository.findPendingBySubscription(subscriptionId)
    if (payment?.stripeCheckoutSessionId) await this.stripeGateway.expireCheckout(payment.stripeCheckoutSessionId)
  }

  async confirmManualPayment(subscriptionId: number, recordedById: number): Promise<void> {
    const payment = await this.repository.findPendingBySubscription(subscriptionId)
    if (!payment) throw new ConflictError('Pending payment not found')
    await this.repository.updatePayment(payment.id, {
      status: PaymentStatus.SUCCEEDED,
      recordedById,
      paidAt: new Date(),
    })
  }

  async handleWebhook(payload: Buffer, signature: string): Promise<void> {
    const event = this.stripeGateway.constructEvent(payload, signature)
    const existing = await this.repository.findStripeEvent(event.id)
    if (existing?.processedAt) return
    if (!existing) await this.repository.saveStripeEvent(event)
    await this.processQueuedWebhook(event.id)
  }

  async processQueuedWebhook(eventId: string): Promise<void> {
    const storedEvent = await this.repository.findStripeEvent(eventId)
    if (!storedEvent || storedEvent.processedAt) return

    const event = {
      id: storedEvent.id,
      type: storedEvent.type,
      data: { object: storedEvent.payload },
    } as unknown as Stripe.Event

    try {
      await this.processEvent(event)
      await this.repository.markStripeEventProcessed(eventId)
    } catch (error: unknown) {
      await this.repository.markStripeEventFailed(eventId, error)
      throw error
    }
  }

  private async processEvent(event: Stripe.Event): Promise<void> {
    if (event.type === 'checkout.session.completed') {
      await this.processCheckoutCompleted(event.data.object as Stripe.Checkout.Session)
    }
    if (event.type === 'payment_intent.payment_failed') {
      await this.processPaymentIntentFailed(event.data.object as Stripe.PaymentIntent)
    }
    if (event.type === 'charge.refunded') {
      await this.processRefund(event.data.object as Stripe.Charge)
    }
  }

  private async processCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
    const subscriptionId = Number(session.metadata?.subscription_id)
    const paymentId = Number(session.metadata?.payment_id)
    if (!Number.isInteger(subscriptionId) || !Number.isInteger(paymentId)) {
      throw new ConflictError('Stripe Checkout metadata is invalid')
    }

    const subscription = await this.repository.findSubscriptionById(subscriptionId)
    const membership = subscription ? await this.repository.findMembershipById(subscription.membershipId) : null
    const payment = await this.repository.findById(paymentId)
    if (!subscription || !membership || !payment) throw new ConflictError('Stripe payment references are invalid')

    const startDate = todayInTimezone(this.timezone)
    await this.repository.updatePayment(paymentId, {
      status: PaymentStatus.SUCCEEDED,
      stripePaymentIntentId: typeof session.payment_intent === 'string' ? session.payment_intent : null,
      paidAt: new Date(),
    })
    await this.repository.activateSubscription(subscriptionId, startDate, addDays(startDate, membership.durationDays - 1))
  }

  private async processPaymentIntentFailed(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    const paymentId = Number(paymentIntent.metadata?.payment_id)
    const payment = Number.isInteger(paymentId)
      ? await this.repository.findById(paymentId)
      : await this.repository.findByStripePaymentIntentId(paymentIntent.id)
    if (!payment) throw new ConflictError('Stripe payment intent is not registered')
    await this.repository.updatePayment(payment.id, {
      stripePaymentIntentId: paymentIntent.id,
      status: PaymentStatus.FAILED,
    })
  }

  private async processRefund(charge: Stripe.Charge): Promise<void> {
    const paymentIntentId = typeof charge.payment_intent === 'string' ? charge.payment_intent : null
    const paymentId = Number(charge.metadata?.payment_id)
    if (!paymentIntentId && !Number.isInteger(paymentId)) throw new ConflictError('Stripe refunded charge has no payment reference')

    const payment = Number.isInteger(paymentId)
      ? await this.repository.findById(paymentId)
      : await this.repository.findByStripePaymentIntentId(paymentIntentId!)
    if (!payment) throw new ConflictError('Refunded Stripe payment is not registered')
    await this.repository.updatePayment(payment.id, {
      stripePaymentIntentId: paymentIntentId ?? payment.stripePaymentIntentId,
      status: PaymentStatus.REFUNDED,
      refundedAmount: charge.amount_refunded,
      receiptUrl: charge.receipt_url,
    })
  }
}

function todayInTimezone(timezone: string): string {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit',
    }).format(new Date())
  } catch {
    throw new ConflictError('GYM_TIMEZONE is invalid')
  }
}

function addDays(date: string, days: number): string {
  const value = new Date(`${date}T00:00:00Z`)
  value.setUTCDate(value.getUTCDate() + days)
  return value.toISOString().slice(0, 10)
}
