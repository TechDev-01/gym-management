import { Button, MenuItem, Stack, TableCell, TableRow, TextField, Typography } from '@mui/material'
import { useMemo, useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { EmptyState, ErrorState, LoadingState } from '../../../components/feedback/States'
import { SearchField } from '../../../components/forms/SearchField'
import { AppShell } from '../../../components/layout/AppShell'
import { PageHeader } from '../../../components/layout/PageHeader'
import { DataTable } from '../../../components/ui/DataTable'
import { Icon } from '../../../components/ui/Icon'
import { StatusBadge } from '../../../components/ui/StatusBadge'
import { HttpError } from '../../../lib/http'
import { formatDate } from '../../../utils/format'
import {
  canCreateSubscriptions,
  canManageSubscriptions,
  useAuth,
} from '../../auth'
import { useClients } from '../../clients/hooks'
import { useMemberships, useSubscriptions } from '../hooks'
import { subscriptionStatusMeta } from '../status'
import type { SubscriptionStatus } from '../types'

type StatusFilterValue = 'all' | SubscriptionStatus

const statusOptions: Array<{ value: StatusFilterValue; label: string }> = [
  { value: 'all', label: 'Todos los estados' },
  { value: 'ACTIVE', label: 'Activas' },
  { value: 'PENDING', label: 'Pendientes' },
  { value: 'EXPIRED', label: 'Vencidas' },
  { value: 'CANCELLED', label: 'Canceladas' },
]

function errorMessage(error: unknown): string {
  return error instanceof HttpError || error instanceof Error
    ? error.message
    : 'No fue posible cargar las suscripciones.'
}

export function SubscriptionsPage() {
  const { user } = useAuth()
  const canManage = canManageSubscriptions(user?.role)
  const canCreate = canCreateSubscriptions(user?.role)
  const [status, setStatus] = useState<StatusFilterValue>('all')
  const [search, setSearch] = useState('')
  const subscriptionsQuery = useSubscriptions(status === 'all' ? {} : { status })
  const membershipsQuery = useMemberships(canManage)
  const clientsQuery = useClients(canManage)

  const clientNames = useMemo(
    () => new Map((clientsQuery.data ?? []).map((client) => [client.id, `${client.name} ${client.lastName}`])),
    [clientsQuery.data],
  )
  const membershipNames = useMemo(
    () => new Map((membershipsQuery.data ?? []).map((membership) => [membership.id, membership.name])),
    [membershipsQuery.data],
  )

  const subscriptions = useMemo(() => {
    const normalized = search.trim().toLowerCase()

    return (subscriptionsQuery.data ?? []).filter((subscription) => {
      if (!normalized) return true

      const clientName = clientNames.get(subscription.clientId) ?? ''
      const membershipName = membershipNames.get(subscription.membershipId) ?? ''
      return `${clientName} ${membershipName} ${subscription.clientId} ${subscription.membershipId}`
        .toLowerCase()
        .includes(normalized)
    })
  }, [clientNames, membershipNames, search, subscriptionsQuery.data])

  const total = subscriptionsQuery.data?.length ?? 0

  return (
    <AppShell>
      <PageHeader
        eyebrow="Contratación"
        title="Suscripciones"
        subtitle="Consulta el estado de las suscripciones y sus fechas de vigencia."
        actions={
          canCreate ? (
            <Button
              component={RouterLink}
              to="/subscriptions/new"
              variant="contained"
              startIcon={<Icon name="add" size={18} />}
            >
              Nueva suscripción
            </Button>
          ) : undefined
        }
      />
      <Stack spacing={2}>
        <Stack sx={{ flexDirection: { xs: 'column', sm: 'row' }, gap: 1.5 }}>
          <SearchField
            value={search}
            onChange={setSearch}
            placeholder="Buscar por cliente o membresía"
            label="Buscar suscripciones"
          />
          <TextField
            select
            size="small"
            label="Estado de suscripción"
            value={status}
            onChange={(event) => setStatus(event.target.value as StatusFilterValue)}
            sx={{ minWidth: { sm: 220 } }}
          >
            {statusOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
        {subscriptionsQuery.isLoading && <LoadingState label="Cargando suscripciones..." />}
        {subscriptionsQuery.isError && <ErrorState message={errorMessage(subscriptionsQuery.error)} />}
        {subscriptionsQuery.isSuccess && (
          <Typography variant="caption" color="text.secondary">
            {subscriptions.length} de {total} suscripciones
          </Typography>
        )}
        {subscriptionsQuery.isSuccess && subscriptions.length === 0 && (
          <EmptyState
            message={
              search || status !== 'all'
                ? 'No hay suscripciones que coincidan con los filtros.'
                : 'No hay suscripciones registradas.'
            }
          />
        )}
        {subscriptionsQuery.isSuccess && subscriptions.length > 0 && (
          <DataTable
            headers={['CLIENTE', 'MEMBRESÍA', 'ESTADO', 'INICIO', 'VENCE', 'ACCIONES']}
            minWidth={880}
          >
            {subscriptions.map((subscription) => {
              const statusMeta = subscriptionStatusMeta(subscription.status)

              return (
                <TableRow key={subscription.id} hover>
                  <TableCell>
                    {clientNames.get(subscription.clientId) ?? `Cliente #${subscription.clientId}`}
                  </TableCell>
                  <TableCell>
                    {membershipNames.get(subscription.membershipId) ??
                      `Membresía #${subscription.membershipId}`}
                  </TableCell>
                  <TableCell>
                    <StatusBadge label={statusMeta.label} status={statusMeta.tone} />
                  </TableCell>
                  <TableCell>{formatDate(subscription.startDate)}</TableCell>
                  <TableCell>{formatDate(subscription.endDate)}</TableCell>
                  <TableCell>
                    <Button
                      component={RouterLink}
                      to={`/subscriptions/${subscription.id}`}
                      size="small"
                    >
                      Ver
                    </Button>
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
