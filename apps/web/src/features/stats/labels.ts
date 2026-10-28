import type { StatusTone } from '../payments/status'
import type { ReportStatus } from './types'

export function statsPaymentStatusMeta(status: string): { label: string; tone: StatusTone } {
  switch (status.toLowerCase()) {
    case 'succeeded':
      return { label: 'Completado', tone: 'success' }
    case 'pending':
      return { label: 'Pendiente', tone: 'pending' }
    case 'failed':
      return { label: 'Fallido', tone: 'error' }
    case 'refunded':
      return { label: 'Reembolsado', tone: 'info' }
    default:
      return { label: status, tone: 'info' }
  }
}

export function reportStatusMeta(status: ReportStatus): { label: string; tone: StatusTone } {
  switch (status) {
    case 'pending':
      return { label: 'Pendiente', tone: 'pending' }
    case 'completed':
      return { label: 'Completado', tone: 'success' }
    case 'failed':
      return { label: 'Fallido', tone: 'error' }
  }
}
