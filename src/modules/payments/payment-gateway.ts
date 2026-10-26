import Stripe from 'stripe'
import type { NextFunction, Request, Response } from 'express'
import type { Repository } from 'typeorm'
import { env } from '../../config/env.js'
import { ConflictError } from '../../shared/errors/conflict.error.js'
import { Client } from '../clients/client.entity.js'
import { Membership } from '../memberships/membership.entity.js'
import { Subscription } from '../memberships/subscription.entity.js'
import type { PaymentGateway, PaymentPreparation } from '../memberships/types.js'
import { SubscriptionStatus } from '../memberships/subscription.entity.js'
import { Payment, PaymentMethod, PaymentStatus } from './payment.entity.js'
import { StripeEvent } from './stripe-event.entity.js'

export class TypeOrmPaymentGateway implements PaymentGateway {
  private readonly stripe: Stripe

  constructor(
    private readonly paymentRepository: Repository<Payment>,
    private readonly subscriptionRepository: Repository<Subscription>,
    private readonly membershipRepository: Repository<Membership>,
    private readonly clientRepository: Repository<Client>,
    private readonly stripeEventRepository: Repository<StripeEvent>,
  ) {
    this.stripe = new Stripe(env.STRIPE_SECRET_KEY)
  }

  async prepare(input: PaymentPreparation): Promise<{ checkoutUrl: string | null }> {
    const subscription = await this.subscriptionRepository.findOneBy({ id: input.subscriptionId })
    if (!subscription) throw new ConflictError('Subscription not found while preparing payment')
    const membership = await this.membershipRepository.findOneBy({ id: subscription.membershipId })
    const client = await this.clientRepository.findOneBy({ id: subscription.clientId })
    if (!membership || !client) throw new ConflictError('Payment references are no longer available')

    const payment = await this.paymentRepository.save(this.paymentRepository.create({
      clientId: client.id,
      subscriptionId: subscription.id,
      method: input.method,
      status: PaymentStatus.PENDING,
      amount: membership.priceAmount,
      currency: membership.currency,
      refundedAmount: 0,
      stripeCheckoutSessionId: null,
      stripePaymentIntentId: null,
      stripeInvoiceId: null,
      receiptUrl: null,
      recordedById: null,
      paidAt: null,
    }))

    if (input.method !== PaymentMethod.CARD) return { checkoutUrl: null }

    const price = membership.stripePriceId
      ? { price: membership.stripePriceId, quantity: 1 }
      : {
          price_data: {
            currency: membership.currency.toLowerCase(),
            product_data: { name: membership.name },
            unit_amount: membership.priceAmount,
          },
          quantity: 1,
        }
    const session = await this.stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [price],
      customer_email: client.email ?? undefined,
      success_url: env.STRIPE_SUCCESS_URL,
      cancel_url: env.STRIPE_CANCEL_URL,
      metadata: {
        subscription_id: String(subscription.id),
        payment_id: String(payment.id),
      },
    })

    await this.paymentRepository.update(payment.id, {
      stripeCheckoutSessionId: session.id,
    })
    return { checkoutUrl: session.url }
  }

  async expirePendingCheckout(subscriptionId: number): Promise<void> {
    const payment = await this.paymentRepository.findOneBy({
      subscriptionId,
      status: PaymentStatus.PENDING,
    })
    if (!payment?.stripeCheckoutSessionId) return
    const session = await this.stripe.checkout.sessions.retrieve(payment.stripeCheckoutSessionId)
    if (session.status === 'open') await this.stripe.checkout.sessions.expire(session.id)
  }

  async confirmManualPayment(subscriptionId: number, recordedById: number): Promise<void> {
    const payment = await this.paymentRepository.findOneBy({
      subscriptionId,
      status: PaymentStatus.PENDING,
    })
    if (!payment) throw new ConflictError('Pending payment not found')
    await this.paymentRepository.update(payment.id, {
      status: PaymentStatus.SUCCEEDED,
      recordedById,
      paidAt: new Date(),
    })
  }

  async handleWebhook(payload: Buffer, signature: string): Promise<void> {
    const event = this.stripe.webhooks.constructEvent(
      payload,
      signature,
      env.STRIPE_WEBHOOK_SECRET,
    )
    const existing = await this.stripeEventRepository.findOneBy({ id: event.id })
    if (existing?.processedAt) return

    if (!existing) {
      const stripeEvent = this.stripeEventRepository.create()
      stripeEvent.id = event.id
      stripeEvent.type = event.type
      stripeEvent.payload = event.data.object as unknown as Record<string, unknown>
      stripeEvent.receivedAt = new Date()
      stripeEvent.processedAt = null
      stripeEvent.error = null
      await this.stripeEventRepository.save(stripeEvent)
    }

    try {
      if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session
        const subscriptionId = Number(session.metadata?.subscription_id)
        const paymentId = Number(session.metadata?.payment_id)
        if (!Number.isInteger(subscriptionId) || !Number.isInteger(paymentId)) {
          throw new ConflictError('Stripe Checkout metadata is invalid')
        }

        const subscription = await this.subscriptionRepository.findOneBy({ id: subscriptionId })
        const membership = subscription
          ? await this.membershipRepository.findOneBy({ id: subscription.membershipId })
          : null
        if (!subscription || !membership) throw new ConflictError('Stripe subscription references are invalid')

        const startDate = todayInTimezone(env.GYM_TIMEZONE)
        const endDate = addDays(startDate, membership.durationDays - 1)
        await this.paymentRepository.update(paymentId, {
          status: PaymentStatus.SUCCEEDED,
          stripePaymentIntentId: typeof session.payment_intent === 'string'
            ? session.payment_intent
            : null,
          paidAt: new Date(),
        })
        await this.subscriptionRepository.update(subscriptionId, {
          status: SubscriptionStatus.ACTIVE,
          startDate,
          endDate,
        })
      }

      await this.stripeEventRepository.update(event.id, {
        processedAt: new Date(),
        error: null,
      })
    } catch (error: unknown) {
      await this.stripeEventRepository.update(event.id, {
        error: error instanceof Error ? error.message : 'Webhook processing failed',
      })
      throw error
    }
  }
}

export function createPaymentWebhookHandler(gateway: TypeOrmPaymentGateway) {
  return async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      const signature = request.header('stripe-signature')
      if (!signature || !Buffer.isBuffer(request.body)) {
        throw new ConflictError('Stripe signature or raw body is missing')
      }
      await gateway.handleWebhook(request.body, signature)
      response.status(200).json({ received: true })
    } catch (error: unknown) {
      next(error)
    }
  }
}

function todayInTimezone(timezone: string): string {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
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
