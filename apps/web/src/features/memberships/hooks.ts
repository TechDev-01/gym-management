import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { paymentsQueryKey } from '../payments/hooks'
import {
  cancelSubscription,
  confirmManualPayment,
  createMembership,
  createSubscription,
  getMembership,
  getMemberships,
  getSubscription,
  getSubscriptions,
  setMembershipStatus,
  updateMembership,
} from './api'
import type {
  CreateSubscriptionInput,
  MembershipInput,
  MembershipUpdateInput,
  SubscriptionFilters,
} from './types'

export const membershipsQueryKey = ['memberships'] as const
export const subscriptionsQueryKey = ['subscriptions'] as const

export function useMemberships(includeInactive = false, enabled = true) {
  return useQuery({
    queryKey: [...membershipsQueryKey, 'list', { includeInactive }],
    queryFn: () => getMemberships(includeInactive),
    enabled,
  })
}

export function useMembership(id: number, enabled = true) {
  return useQuery({
    queryKey: [...membershipsQueryKey, 'detail', id],
    queryFn: () => getMembership(id),
    enabled: enabled && Number.isInteger(id) && id > 0,
  })
}

export function useCreateMembership() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: MembershipInput) => createMembership(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: membershipsQueryKey })
      queryClient.invalidateQueries({ queryKey: subscriptionsQueryKey })
    },
  })
}

export function useUpdateMembership(id: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: MembershipUpdateInput) => updateMembership(id, input),
    onSuccess: (membership) => {
      queryClient.setQueryData([...membershipsQueryKey, 'detail', id], membership)
      queryClient.invalidateQueries({ queryKey: membershipsQueryKey })
      queryClient.invalidateQueries({ queryKey: subscriptionsQueryKey })
    },
  })
}

export function useSetMembershipStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      setMembershipStatus(id, isActive),
    onSuccess: (membership) => {
      queryClient.setQueryData([...membershipsQueryKey, 'detail', membership.id], membership)
      queryClient.invalidateQueries({ queryKey: membershipsQueryKey })
      queryClient.invalidateQueries({ queryKey: subscriptionsQueryKey })
    },
  })
}

export function useSubscriptions(filters: SubscriptionFilters = {}, enabled = true) {
  return useQuery({
    queryKey: [...subscriptionsQueryKey, 'list', filters],
    queryFn: () => getSubscriptions(filters),
    enabled,
  })
}

export function useSubscription(id: number, enabled = true) {
  return useQuery({
    queryKey: [...subscriptionsQueryKey, 'detail', id],
    queryFn: () => getSubscription(id),
    enabled: enabled && Number.isInteger(id) && id > 0,
  })
}

function invalidateSubscriptionRelated(
  queryClient: ReturnType<typeof useQueryClient>,
  clientId?: number,
): void {
  queryClient.invalidateQueries({ queryKey: subscriptionsQueryKey })
  queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
  queryClient.invalidateQueries({ queryKey: paymentsQueryKey })

  if (clientId !== undefined) {
    queryClient.invalidateQueries({ queryKey: ['client-subscriptions', clientId] })
  }
}

export function useCreateSubscription() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ membershipId, input }: { membershipId: number; input: CreateSubscriptionInput }) =>
      createSubscription(membershipId, input),
    onSuccess: (subscription) => {
      queryClient.setQueryData(
        [...subscriptionsQueryKey, 'detail', subscription.id],
        subscription,
      )
      invalidateSubscriptionRelated(queryClient, subscription.clientId)
    },
  })
}

export function useCancelSubscription(id: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => cancelSubscription(id),
    onSuccess: (subscription) => {
      queryClient.setQueryData([...subscriptionsQueryKey, 'detail', id], subscription)
      invalidateSubscriptionRelated(queryClient, subscription.clientId)
    },
  })
}

export function useConfirmManualPayment(id: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => confirmManualPayment(id),
    onSuccess: (subscription) => {
      queryClient.setQueryData([...subscriptionsQueryKey, 'detail', id], subscription)
      invalidateSubscriptionRelated(queryClient, subscription.clientId)
    },
  })
}
