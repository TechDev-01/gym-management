import { useQuery } from '@tanstack/react-query'
import { getPayment, getPayments } from './api'
import type { PaymentFilters } from './types'

export const paymentsQueryKey = ['payments'] as const

export function usePayments(filters: PaymentFilters = {}, enabled = true) {
  return useQuery({
    queryKey: [...paymentsQueryKey, filters],
    queryFn: () => getPayments(filters),
    enabled,
  })
}

export function usePayment(id: number, enabled = true) {
  return useQuery({
    queryKey: [...paymentsQueryKey, 'detail', id],
    queryFn: () => getPayment(id),
    enabled: enabled && Number.isInteger(id) && id > 0,
  })
}
