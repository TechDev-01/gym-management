import type Stripe from 'stripe'
import type { EntityManager, FindOptionsWhere, Repository } from 'typeorm'
import { Membership } from '../memberships/membership.entity.js'
import { Subscription, SubscriptionStatus } from '../memberships/subscription.entity.js'
import type { PendingPaymentInput } from '../memberships/types.js'
import { Payment, PaymentStatus } from './payment.entity.js'
import { StripeEvent } from './stripe-event.entity.js'
import type { PaymentFilters } from './payments.types.js'

export class PaymentsRepository {
  constructor(
    private readonly paymentRepository: Repository<Payment>,
    private readonly subscriptionRepository: Repository<Subscription>,
    private readonly membershipRepository: Repository<Membership>,
    private readonly stripeEventRepository: Repository<StripeEvent>,
  ) {}

  createPendingPayment(manager: EntityManager, input: PendingPaymentInput): Promise<Payment> {
    const repository = manager.getRepository(Payment)
    return repository.save(repository.create({
      clientId: input.clientId,
      subscriptionId: input.subscriptionId,
      method: input.method,
      status: PaymentStatus.PENDING,
      amount: input.amount,
      currency: input.currency,
      refundedAmount: 0,
      stripeCheckoutSessionId: null,
      stripePaymentIntentId: null,
      stripeInvoiceId: null,
      receiptUrl: null,
      recordedById: null,
      paidAt: null,
    }))
  }

  findPendingBySubscription(subscriptionId: number): Promise<Payment | null> {
    return this.paymentRepository.findOneBy({ subscriptionId, status: PaymentStatus.PENDING })
  }

  findById(id: number): Promise<Payment | null> {
    return this.paymentRepository.findOneBy({ id })
  }

  listPayments(filters: PaymentFilters): Promise<Payment[]> {
    const where: FindOptionsWhere<Payment> = {}

    if (filters.clientId !== undefined) { where.clientId = filters.clientId }
    if (filters.subscriptionId !== undefined) { where.subscriptionId = filters.subscriptionId }
    if (filters.method !== undefined) { where.method = filters.method }
    if (filters.status !== undefined) { where.status = filters.status }

    return this.paymentRepository.find({
      where,
      order: { createdAt: 'DESC' },
    })
  }

  findByStripePaymentIntentId(stripePaymentIntentId: string): Promise<Payment | null> {
    return this.paymentRepository.findOneBy({ stripePaymentIntentId })
  }

  async attachCheckoutSession(paymentId: number, sessionId: string): Promise<void> {
    await this.paymentRepository.update(paymentId, { stripeCheckoutSessionId: sessionId })
  }

  async updatePayment(id: number, input: Partial<Payment>): Promise<void> {
    await this.paymentRepository.update(id, input)
  }

  findSubscriptionById(id: number): Promise<Subscription | null> {
    return this.subscriptionRepository.findOneBy({ id })
  }

  findMembershipById(id: number): Promise<Membership | null> {
    return this.membershipRepository.findOneBy({ id })
  }

  async activateSubscription(id: number, startDate: string, endDate: string): Promise<void> {
    await this.subscriptionRepository.update(id, {
      status: SubscriptionStatus.ACTIVE,
      startDate,
      endDate,
    })
  }

  findStripeEvent(id: string): Promise<StripeEvent | null> {
    return this.stripeEventRepository.findOneBy({ id })
  }

  async saveStripeEvent(event: Stripe.Event): Promise<void> {
    await this.stripeEventRepository.save(this.stripeEventRepository.create({
      id: event.id,
      type: event.type,
      payload: event.data.object as unknown as Record<string, unknown>,
      receivedAt: new Date(),
      processedAt: null,
      error: null,
    }))
  }

  async markStripeEventProcessed(id: string): Promise<void> {
    await this.stripeEventRepository.update(id, { processedAt: new Date(), error: null })
  }

  async markStripeEventFailed(id: string, error: unknown): Promise<void> {
    await this.stripeEventRepository.update(id, {
      error: error instanceof Error ? error.message : 'Webhook processing failed',
    })
  }

}
