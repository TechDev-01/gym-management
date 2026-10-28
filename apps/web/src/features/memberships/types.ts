import type { PaymentMethod } from '../payments/types'

export type SubscriptionStatus = 'PENDING' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED'

export interface Membership {
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

export interface MembershipInput {
  name: string
  description: string | null
  durationDays: number
  maxDaysPerWeek: number | null
  priceAmount: number
  currency: string
  stripePriceId: string | null
}

export interface MembershipUpdateInput {
  name?: string
  description?: string | null
  durationDays?: number
  maxDaysPerWeek?: number | null
  priceAmount?: number
}

export interface Subscription {
  id: number
  clientId: number
  membershipId: number
  status: SubscriptionStatus
  startDate: string | null
  endDate: string | null
  createdAt: string
}

export interface SubscriptionWithCheckout extends Subscription {
  checkoutUrl: string | null
}

export interface CreateSubscriptionInput {
  clientId: number
  membershipId: number
  method: PaymentMethod
}

export interface SubscriptionFilters {
  clientId?: number
  status?: SubscriptionStatus
}
