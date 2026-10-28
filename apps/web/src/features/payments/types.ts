import type { components } from '../../types/generated/api'

export type PaymentMethod = components['schemas']['PaymentMethod']

export type PaymentStatus = components['schemas']['PaymentResponse']['status']

export type Payment = components['schemas']['PaymentResponse']

export interface PaymentFilters {
  clientId?: number
  subscriptionId?: number
  method?: PaymentMethod
  status?: PaymentStatus
}
