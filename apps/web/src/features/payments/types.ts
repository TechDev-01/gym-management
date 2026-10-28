export type PaymentMethod = 'CARD' | 'CASH' | 'TRANSFER'

export type PaymentStatus = 'PENDING' | 'SUCCEEDED' | 'FAILED' | 'REFUNDED'

export interface Payment {
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
  paidAt: string | null
  createdAt: string
}

export interface PaymentFilters {
  clientId?: number
  subscriptionId?: number
  method?: PaymentMethod
  status?: PaymentStatus
}
