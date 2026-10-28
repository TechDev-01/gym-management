import { request } from '../../lib/http'
import type { Payment, PaymentFilters } from './types'

function buildPath(path: string, filters: PaymentFilters): string {
  const searchParams = new URLSearchParams()

  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined) {
      searchParams.set(key, String(value))
    }
  }

  const query = searchParams.toString()
  return query ? `${path}?${query}` : path
}

export function getPayments(filters: PaymentFilters = {}): Promise<Payment[]> {
  return request<Payment[]>(buildPath('payments', filters))
}

export function getPayment(id: number): Promise<Payment> {
  return request<Payment>(`payments/${id}`)
}
