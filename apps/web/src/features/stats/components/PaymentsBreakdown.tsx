import { TableCell, TableRow } from '@mui/material'
import { EmptyState } from '../../../components/feedback/States'
import { DataTable } from '../../../components/ui/DataTable'
import { Panel } from '../../../components/ui/Panel'
import { StatusBadge } from '../../../components/ui/StatusBadge'
import { formatCurrency } from '../../../utils/format'
import { statsPaymentStatusMeta } from '../labels'
import type { StatsData } from '../types'

interface PaymentsBreakdownProps {
  payments: StatsData['payments']
  currency: string | null
}

export function PaymentsBreakdown({ payments, currency }: PaymentsBreakdownProps) {
  return (
    <Panel title="Pagos" subtitle="Resumen por estado en el periodo seleccionado">
      {payments.length === 0 ? (
        <EmptyState message="No hay pagos para este periodo." />
      ) : (
        <DataTable headers={['ESTADO', 'OPERACIONES', 'IMPORTE']}>
          {payments.map((payment) => {
            const meta = statsPaymentStatusMeta(payment.status)

            return (
              <TableRow key={payment.status}>
                <TableCell>
                  <StatusBadge label={meta.label} status={meta.tone} />
                </TableCell>
                <TableCell>{payment.count.toLocaleString('es-MX')}</TableCell>
                <TableCell>
                  {formatCurrency(payment.amount, currency ?? 'USD')}
                </TableCell>
              </TableRow>
            )
          })}
        </DataTable>
      )}
    </Panel>
  )
}
