import Stripe from 'stripe'
import { env } from '../../config/env.js'
import { PaymentGatewayError } from '../../shared/errors/payment-gateway.error.js'
import type { CheckoutSessionInput } from '../memberships/types.js'

export interface StripeGateway {
  createCheckoutSession(input: CheckoutSessionInput): Promise<{
    sessionId: string
    checkoutUrl: string | null
  }>
  expireCheckout(sessionId: string): Promise<void>
  constructEvent(payload: Buffer, signature: string): Stripe.Event
}

export class StripePaymentGateway implements StripeGateway {
  private readonly stripe = new Stripe(env.STRIPE_SECRET_KEY)

  async createCheckoutSession(input: CheckoutSessionInput): Promise<{
    sessionId: string
    checkoutUrl: string | null
  }> {
    const price = input.membershipPriceId
      ? { price: input.membershipPriceId, quantity: 1 }
      : {
          price_data: {
            currency: input.currency.toLowerCase(),
            product_data: { name: input.membershipName },
            unit_amount: input.amount,
          },
          quantity: 1,
        }

    try {
      const session = await this.stripe.checkout.sessions.create({
        mode: 'payment',
        line_items: [price],
        customer_email: input.clientEmail ?? undefined,
        success_url: env.STRIPE_SUCCESS_URL,
        cancel_url: env.STRIPE_CANCEL_URL,
        payment_intent_data: {
          metadata: {
            subscription_id: String(input.subscriptionId),
            payment_id: String(input.paymentId),
          },
        },
        metadata: {
          subscription_id: String(input.subscriptionId),
          payment_id: String(input.paymentId),
        },
      })

      return { sessionId: session.id, checkoutUrl: session.url }
    } catch (error: unknown) {
      throw new PaymentGatewayError(getPaymentProviderMessage(error))
    }
  }

  async expireCheckout(sessionId: string): Promise<void> {
    const session = await this.stripe.checkout.sessions.retrieve(sessionId)
    if (session.status === 'open') await this.stripe.checkout.sessions.expire(session.id)
  }

  constructEvent(payload: Buffer, signature: string): Stripe.Event {
    return this.stripe.webhooks.constructEvent(
      payload,
      signature,
      env.STRIPE_WEBHOOK_SECRET,
    )
  }
}

function getPaymentProviderMessage(error: unknown): string {
  if (error instanceof Stripe.errors.StripeError) {
    return `Stripe checkout failed: ${error.message}`
  }

  if (error instanceof Error) {
    return `Payment provider failed: ${error.message}`
  }

  return 'Payment provider failed'
}
