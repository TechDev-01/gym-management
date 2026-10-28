import type { StatusTone } from '../payments/status'
import type { SubscriptionStatus } from './types'

export function subscriptionStatusMeta(status: SubscriptionStatus): {
  label: string
  tone: StatusTone
} {
  switch (status) {
    case 'ACTIVE':
      return { label: 'Activa', tone: 'success' }
    case 'PENDING':
      return { label: 'Pendiente', tone: 'pending' }
    case 'EXPIRED':
      return { label: 'Vencida', tone: 'error' }
    case 'CANCELLED':
      return { label: 'Cancelada', tone: 'info' }
  }
}
