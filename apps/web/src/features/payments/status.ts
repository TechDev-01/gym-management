import type { PaymentMethod, PaymentStatus } from './types'

export type StatusTone = 'success' | 'pending' | 'error' | 'info'

export function paymentStatusMeta(status: PaymentStatus): { label: string; tone: StatusTone } {
  switch (status) {
    case 'SUCCEEDED':
      return { label: 'Completado', tone: 'success' }
    case 'PENDING':
      return { label: 'Pendiente', tone: 'pending' }
    case 'FAILED':
      return { label: 'Fallido', tone: 'error' }
    case 'REFUNDED':
      return { label: 'Reembolsado', tone: 'info' }
  }
}

export function paymentMethodLabel(method: PaymentMethod): string {
  switch (method) {
    case 'CARD':
      return 'Tarjeta'
    case 'CASH':
      return 'Efectivo'
    case 'TRANSFER':
      return 'Transferencia'
  }
}
