import type { PaymentMethod } from '../payments/payment.entity.js'
import type { EntityManager } from 'typeorm'
import type { Membership } from './membership.entity.js'
import type { Subscription, SubscriptionStatus } from './subscription.entity.js'

export interface CreateMembershipInput {
  name: string
  description: string | null
  durationDays: number
  maxDaysPerWeek: number | null
  priceAmount: number
  currency: string
  stripePriceId: string | null
}

export interface UpdateMembershipInput {
  name?: string
  description?: string | null
  durationDays?: number
  maxDaysPerWeek?: number | null
  priceAmount?: number
}

export interface CreateSubscriptionInput {
  clientId: number
  membershipId: number
  method: PaymentMethod
}

export interface MembershipFilters {
  includeInactive: boolean
}

export interface SubscriptionFilters {
  clientId?: number
  status?: SubscriptionStatus
}

export interface MembershipResponse {
  id: number
  name: string
  description: string | null
  durationDays: number
  maxDaysPerWeek: number | null
  priceAmount: number
  currency: string
  isActive: boolean
  stripePriceId: string | null
}

export interface SubscriptionResponse {
  id: number
  clientId: number
  membershipId: number
  status: SubscriptionStatus
  startDate: string | null
  endDate: string | null
  createdAt: Date
}

export interface PendingPaymentInput {
  subscriptionId: number
  clientId: number
  amount: number
  currency: string
  method: PaymentMethod
}

export interface CheckoutSessionInput {
  subscriptionId: number
  paymentId: number
  membershipName: string
  membershipPriceId: string | null
  amount: number
  currency: string
  clientEmail: string | null
}

export interface PaymentGateway {
  createPendingPayment(
    manager: EntityManager,
    input: PendingPaymentInput,
  ): Promise<{ paymentId: number }>
  createCheckoutSession(input: CheckoutSessionInput): Promise<{
    sessionId: string
    checkoutUrl: string | null
  }>
  attachCheckoutSession(paymentId: number, sessionId: string): Promise<void>
  markPaymentFailed(paymentId: number): Promise<void>
  expirePendingCheckout(subscriptionId: number): Promise<void>
  confirmManualPayment(subscriptionId: number, recordedById: number): Promise<void>
}

export function toMembershipResponse(membership: Membership): MembershipResponse {
  return {
    id: membership.id,
    name: membership.name,
    description: membership.description,
    durationDays: membership.durationDays,
    maxDaysPerWeek: membership.maxDaysPerWeek,
    priceAmount: membership.priceAmount,
    currency: membership.currency,
    stripePriceId: membership.stripePriceId,
    isActive: membership.isActive,
  }
}

export function toSubscriptionResponse(subscription: Subscription): SubscriptionResponse {
  return {
    id: subscription.id,
    clientId: subscription.clientId,
    membershipId: subscription.membershipId,
    status: subscription.status,
    startDate: subscription.startDate,
    endDate: subscription.endDate,
    createdAt: subscription.createdAt,
  }
}
