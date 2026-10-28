import type { Payment, PaymentMethod, PaymentStatus } from './payment.entity.js'

export interface PaymentFilters {
  clientId?: number
  subscriptionId?: number
  method?: PaymentMethod
  status?: PaymentStatus
}

export interface PaymentResponse {
  id: number
  clientId: number
  subscriptionId: number
  method: PaymentMethod
  status: PaymentStatus
  amount: number
  currency: string
  refundedAmount: number
  receiptUrl: string | null
  recordedById: number | null
  paidAt: Date | null
  createdAt: Date
}

export function toPaymentResponse(payment: Payment): PaymentResponse {
  return {
    id: payment.id,
    clientId: payment.clientId,
    subscriptionId: payment.subscriptionId,
    method: payment.method,
    status: payment.status,
    amount: payment.amount,
    currency: payment.currency,
    refundedAmount: payment.refundedAmount,
    receiptUrl: payment.receiptUrl,
    recordedById: payment.recordedById,
    paidAt: payment.paidAt,
    createdAt: payment.createdAt,
  }
}
