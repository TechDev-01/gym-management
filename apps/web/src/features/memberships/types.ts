import type { PaymentMethod } from '../payments/types'
import type { components } from '../../types/generated/api'

export type SubscriptionStatus = components['schemas']['SubscriptionStatus']

export type Membership = components['schemas']['MembershipResponse']

export type MembershipInput = components['schemas']['CreateMembershipRequest']

export type MembershipUpdateInput = components['schemas']['UpdateMembershipRequest']

export type Subscription = components['schemas']['SubscriptionResponse']

export type SubscriptionWithCheckout = components['schemas']['SubscriptionWithCheckoutResponse']

export type CreateSubscriptionInput = components['schemas']['CreateSubscriptionRequest']

export interface SubscriptionFilters {
  clientId?: number
  status?: SubscriptionStatus
}
