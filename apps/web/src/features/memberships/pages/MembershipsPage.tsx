import { Alert, Button, Stack, TableCell, TableRow, Typography } from '@mui/material'
import { useMemo, useState } from 'react'
import { Link as RouterLink, useLocation } from 'react-router-dom'
import { EmptyState, ErrorState, LoadingState } from '../../../components/feedback/States'
import { SearchField } from '../../../components/forms/SearchField'
import { StatusFilter, type StatusFilterValue } from '../../../components/forms/StatusFilter'
import { AppShell } from '../../../components/layout/AppShell'
import { PageHeader } from '../../../components/layout/PageHeader'
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog'
import { DataTable } from '../../../components/ui/DataTable'
import { Icon } from '../../../components/ui/Icon'
import { StatusBadge } from '../../../components/ui/StatusBadge'
import { HttpError } from '../../../lib/http'
import { formatCurrency } from '../../../utils/format'
import {
  canChangeMembershipStatus,
  canManageMemberships,
  useAuth,
} from '../../auth'
import { useMemberships, useSetMembershipStatus } from '../hooks'
import type { Membership } from '../types'

function errorMessage(error: unknown): string {
  return error instanceof HttpError || error instanceof Error
    ? error.message
    : 'No fue posible cargar las membresías.'
}

export function MembershipsPage() {
  const { user } = useAuth()
  const location = useLocation()
  const canManage = canManageMemberships(user?.role)
  const canChangeStatus = canChangeMembershipStatus(user?.role)
  const membershipsQuery = useMemberships(canManage)
  const statusMutation = useSetMembershipStatus()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<StatusFilterValue>('all')
  const [pendingChange, setPendingChange] = useState<Membership | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(
    (location.state as { message?: string } | null)?.message ?? null,
  )

  const memberships = useMemo(() => {
    const normalized = search.trim().toLowerCase()

    return (membershipsQuery.data ?? []).filter((membership) => {
      const matchesSearch =
        !normalized ||
        `${membership.name} ${membership.description ?? ''}`.toLowerCase().includes(normalized)
      const matchesStatus =
        status === 'all' || (status === 'active' ? membership.isActive : !membership.isActive)

      return matchesSearch && matchesStatus
    })
  }, [membershipsQuery.data, search, status])

  const confirmStatusChange = async () => {
    if (!pendingChange) return

    setActionError(null)

    try {
      await statusMutation.mutateAsync({
        id: pendingChange.id,
        isActive: !pendingChange.isActive,
      })
      setPendingChange(null)
    } catch (error: unknown) {
      setActionError(errorMessage(error))
      setPendingChange(null)
    }
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow="Catálogo"
        title="Membresías"
        subtitle="Planes disponibles para contratar y renovar suscripciones."
        actions={
          canManage ? (
            <Button
              component={RouterLink}
              to="/memberships/new"
              variant="contained"
              startIcon={<Icon name="add" size={18} />}
            >
              Nueva membresía
            </Button>
          ) : undefined
        }
      />
      <Stack spacing={2}>
        {message && (
          <Alert severity="success" onClose={() => setMessage(null)}>
            {message}
          </Alert>
        )}
        {actionError && <ErrorState message={actionError} />}
        <Stack sx={{ flexDirection: { xs: 'column', sm: 'row' }, gap: 1.5 }}>
          <SearchField
            value={search}
            onChange={setSearch}
            placeholder="Buscar por nombre o descripción"
            label="Buscar membresías"
          />
          {canManage && <StatusFilter value={status} onChange={setStatus} />}
        </Stack>
        {membershipsQuery.isLoading && <LoadingState label="Cargando membresías..." />}
        {membershipsQuery.isError && <ErrorState message={errorMessage(membershipsQuery.error)} />}
        {membershipsQuery.isSuccess && (
          <Typography variant="caption" color="text.secondary">
            {memberships.length} de {membershipsQuery.data.length} membresías
          </Typography>
        )}
        {membershipsQuery.isSuccess && memberships.length === 0 && (
          <EmptyState
            message={
              search || status !== 'all'
                ? 'No hay membresías que coincidan con los filtros.'
                : 'No hay membresías registradas.'
            }
          />
        )}
        {membershipsQuery.isSuccess && memberships.length > 0 && (
          <DataTable headers={['MEMBRESÍA', 'DURACIÓN', 'PRECIO', 'ESTADO', 'ACCIONES']} minWidth={820}>
            {memberships.map((membership) => (
              <TableRow key={membership.id} hover>
                <TableCell>
                  {membership.name}
                  {membership.description && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      {membership.description}
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  {membership.durationDays} días
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                    {membership.maxDaysPerWeek
                      ? `${membership.maxDaysPerWeek} días/semana`
                      : 'Acceso ilimitado'}
                  </Typography>
                </TableCell>
                <TableCell>{formatCurrency(membership.priceAmount, membership.currency)}</TableCell>
                <TableCell>
                  <StatusBadge
                    label={membership.isActive ? 'Activa' : 'Inactiva'}
                    status={membership.isActive ? 'success' : 'error'}
                  />
                </TableCell>
                <TableCell>
                  {canManage && (
                    <Button
                      component={RouterLink}
                      to={`/memberships/${membership.id}/edit`}
                      size="small"
                    >
                      Editar
                    </Button>
                  )}
                  {canChangeStatus && (
                    <Button size="small" onClick={() => setPendingChange(membership)}>
                      {membership.isActive ? 'Desactivar' : 'Activar'}
                    </Button>
                  )}
                  {!canManage && !canChangeStatus && (
                    <Typography variant="caption" color="text.secondary">
                      Solo consulta
                    </Typography>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </DataTable>
        )}
      </Stack>
      <ConfirmDialog
        open={pendingChange !== null}
        title={pendingChange?.isActive ? 'Desactivar membresía' : 'Activar membresía'}
        description={
          pendingChange?.isActive
            ? `La membresía "${pendingChange?.name ?? ''}" dejará de estar disponible para nuevas contrataciones. Las suscripciones existentes no se modifican.`
            : `La membresía "${pendingChange?.name ?? ''}" volverá a estar disponible para nuevas contrataciones.`
        }
        confirmLabel={pendingChange?.isActive ? 'Desactivar' : 'Activar'}
        loading={statusMutation.isPending}
        onConfirm={() => { void confirmStatusChange() }}
        onClose={() => setPendingChange(null)}
      />
    </AppShell>
  )
}
