import { Button, MenuItem, Stack, TableCell, TableRow, TextField, Typography } from '@mui/material'
import { useMemo, useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { EmptyState, ErrorState, LoadingState } from '../../../components/feedback/States'
import { SearchField } from '../../../components/forms/SearchField'
import { AppShell } from '../../../components/layout/AppShell'
import { PageHeader } from '../../../components/layout/PageHeader'
import { DataTable } from '../../../components/ui/DataTable'
import { StatusBadge } from '../../../components/ui/StatusBadge'
import { HttpError } from '../../../lib/http'
import { formatCurrency, formatDateTime } from '../../../utils/format'
import { useClients } from '../../clients/hooks'
import { usePayments } from '../hooks'
import { paymentMethodLabel, paymentStatusMeta } from '../status'
import type { PaymentFilters, PaymentMethod, PaymentStatus } from '../types'

type StatusFilterValue = 'all' | PaymentStatus
type MethodFilterValue = 'all' | PaymentMethod

const statusOptions: Array<{ value: StatusFilterValue; label: string }> = [
  { value: 'all', label: 'Todos los estados' },
  { value: 'SUCCEEDED', label: 'Completados' },
  { value: 'PENDING', label: 'Pendientes' },
  { value: 'FAILED', label: 'Fallidos' },
  { value: 'REFUNDED', label: 'Reembolsados' },
]

const methodOptions: Array<{ value: MethodFilterValue; label: string }> = [
  { value: 'all', label: 'Todos los métodos' },
  { value: 'CARD', label: 'Tarjeta' },
  { value: 'CASH', label: 'Efectivo' },
  { value: 'TRANSFER', label: 'Transferencia' },
]

function errorMessage(error: unknown): string {
  return error instanceof HttpError || error instanceof Error
    ? error.message
    : 'No fue posible cargar los pagos.'
}

export function PaymentsPage() {
  const [status, setStatus] = useState<StatusFilterValue>('all')
  const [method, setMethod] = useState<MethodFilterValue>('all')
  const [search, setSearch] = useState('')
  const filters = useMemo<PaymentFilters>(
    () => ({
      ...(status === 'all' ? {} : { status }),
      ...(method === 'all' ? {} : { method }),
    }),
    [method, status],
  )
  const paymentsQuery = usePayments(filters)
  const clientsQuery = useClients()

  const clientNames = useMemo(
    () => new Map((clientsQuery.data ?? []).map((client) => [client.id, `${client.name} ${client.lastName}`])),
    [clientsQuery.data],
  )
  const payments = useMemo(() => {
    const normalized = search.trim().toLowerCase()

    return (paymentsQuery.data ?? []).filter((payment) => {
      if (!normalized) return true

      const clientName = clientNames.get(payment.clientId) ?? ''
      return `${clientName} ${payment.clientId} ${payment.subscriptionId} ${payment.id}`
        .toLowerCase()
        .includes(normalized)
    })
  }, [clientNames, paymentsQuery.data, search])

  const total = paymentsQuery.data?.length ?? 0

  return (
    <AppShell>
      <PageHeader
        eyebrow="Cobros"
        title="Pagos"
        subtitle="Consulta pagos manuales y de Stripe sin exponer credenciales privadas."
      />
      <Stack spacing={2}>
        <Stack sx={{ flexDirection: { xs: 'column', sm: 'row' }, gap: 1.5 }}>
          <SearchField
            value={search}
            onChange={setSearch}
            placeholder="Buscar por cliente, pago o suscripción"
            label="Buscar pagos"
          />
          <TextField
            select
            size="small"
            label="Estado del pago"
            value={status}
            onChange={(event) => setStatus(event.target.value as StatusFilterValue)}
            sx={{ minWidth: { sm: 210 } }}
          >
            {statusOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            size="small"
            label="Método de pago"
            value={method}
            onChange={(event) => setMethod(event.target.value as MethodFilterValue)}
            sx={{ minWidth: { sm: 210 } }}
          >
            {methodOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
        {paymentsQuery.isLoading && <LoadingState label="Cargando pagos..." />}
        {paymentsQuery.isError && <ErrorState message={errorMessage(paymentsQuery.error)} />}
        {paymentsQuery.isSuccess && (
          <Typography variant="caption" color="text.secondary">
            {payments.length} de {total} pagos
          </Typography>
        )}
        {paymentsQuery.isSuccess && payments.length === 0 && (
          <EmptyState
            message={
              search || status !== 'all' || method !== 'all'
                ? 'No hay pagos que coincidan con los filtros.'
                : 'No hay pagos registrados.'
            }
          />
        )}
        {paymentsQuery.isSuccess && payments.length > 0 && (
          <DataTable
            headers={['PAGO', 'CLIENTE', 'SUSCRIPCIÓN', 'MÉTODO', 'IMPORTE', 'ESTADO', 'PAGADO', 'RECIBO']}
            minWidth={960}
          >
            {payments.map((payment) => {
              const statusMeta = paymentStatusMeta(payment.status)

              return (
                <TableRow key={payment.id} hover>
                  <TableCell>#{payment.id}</TableCell>
                  <TableCell>
                    {clientNames.get(payment.clientId) ?? `Cliente #${payment.clientId}`}
                  </TableCell>
                  <TableCell>
                    <Button
                      component={RouterLink}
                      to={`/subscriptions/${payment.subscriptionId}`}
                      size="small"
                    >
                      #{payment.subscriptionId}
                    </Button>
                  </TableCell>
                  <TableCell>{paymentMethodLabel(payment.method)}</TableCell>
                  <TableCell>{formatCurrency(payment.amount, payment.currency)}</TableCell>
                  <TableCell>
                    <StatusBadge label={statusMeta.label} status={statusMeta.tone} />
                  </TableCell>
                  <TableCell>{formatDateTime(payment.paidAt)}</TableCell>
                  <TableCell>
                    {payment.receiptUrl ? (
                      <Button
                        component="a"
                        href={payment.receiptUrl}
                        target="_blank"
                        rel="noreferrer"
                        size="small"
                      >
                        Ver recibo
                      </Button>
                    ) : (
                      '—'
                    )}
                  </TableCell>
                </TableRow>
              )
            })}
          </DataTable>
        )}
      </Stack>
    </AppShell>
  )
}
