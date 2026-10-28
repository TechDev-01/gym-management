import { request } from '../../lib/http'
import type {
  CreateSubscriptionInput,
  Membership,
  MembershipInput,
  MembershipUpdateInput,
  Subscription,
  SubscriptionFilters,
  SubscriptionWithCheckout,
} from './types'

function buildPath(path: string, filters: object): string {
  const searchParams = new URLSearchParams()

  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined) {
      searchParams.set(key, String(value))
    }
  }

  const query = searchParams.toString()
  return query ? `${path}?${query}` : path
}

export function getMemberships(includeInactive = false): Promise<Membership[]> {
  return request<Membership[]>(buildPath('memberships', {
    includeInactive: includeInactive ? 'true' : undefined,
  }))
}

export function getMembership(id: number): Promise<Membership> {
  return request<Membership>(`memberships/${id}`)
}

export function createMembership(input: MembershipInput): Promise<Membership> {
  return request<Membership>('memberships', { method: 'POST', body: input })
}

export function updateMembership(id: number, input: MembershipUpdateInput): Promise<Membership> {
  return request<Membership>(`memberships/${id}`, { method: 'PATCH', body: input })
}

export function setMembershipStatus(id: number, isActive: boolean): Promise<Membership> {
  return request<Membership>(`memberships/${id}/status`, {
    method: 'PATCH',
    body: { isActive },
  })
}

export function getSubscriptions(filters: SubscriptionFilters = {}): Promise<Subscription[]> {
  return request<Subscription[]>(buildPath('subscriptions', filters))
}

export function getSubscription(id: number): Promise<Subscription> {
  return request<Subscription>(`subscriptions/${id}`)
}

export function createSubscription(
  membershipId: number,
  input: CreateSubscriptionInput,
): Promise<SubscriptionWithCheckout> {
  return request<SubscriptionWithCheckout>(`memberships/${membershipId}/subscriptions`, {
    method: 'POST',
    body: input,
  })
}

export function cancelSubscription(id: number): Promise<Subscription> {
  return request<Subscription>(`subscriptions/${id}/cancel`, { method: 'POST' })
}

export function confirmManualPayment(id: number): Promise<Subscription> {
  return request<Subscription>(`subscriptions/${id}/payment-confirmation`, { method: 'POST' })
}
