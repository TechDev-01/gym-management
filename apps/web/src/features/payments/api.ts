import { request } from '../../lib/http'
import { requestAllPages } from '../../lib/http/pagination'
import type { Payment, PaymentFilters } from './types'

export function getPayments(filters: PaymentFilters = {}): Promise<Payment[]> {
  return requestAllPages<Payment>('payments', filters)
}

export function getPayment(id: number): Promise<Payment> {
  return request<Payment>(`payments/${id}`)
}
