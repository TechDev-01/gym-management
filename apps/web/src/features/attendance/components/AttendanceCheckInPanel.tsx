import { Alert, Button, Divider, Stack, Typography } from '@mui/material'
import { useMemo, useState } from 'react'
import { ErrorState, LoadingState } from '../../../components/feedback/States'
import { Panel } from '../../../components/ui/Panel'
import { StatusBadge } from '../../../components/ui/StatusBadge'
import { HttpError } from '../../../lib/http'
import { formatDate, formatDateTime } from '../../../utils/format'
import { useClientSubscriptions } from '../../clients/hooks'
import type { Client } from '../../clients/types'
import { useMembership } from '../../memberships/hooks'
import type { Subscription } from '../../memberships/types'
import { attendanceErrorMessage } from '../errors'
import { formatDuration, todayDateString } from '../dates'
import { useAttendance, useCheckIn, useCheckOut } from '../hooks'

interface AttendanceCheckInPanelProps {
  clientId: number
  client?: Client
  selfService?: boolean
}

function queryErrorMessage(error: unknown, fallback: string): string {
  return error instanceof HttpError || error instanceof Error ? error.message : fallback
}

function hasCurrentDates(subscription: Subscription, today: string): boolean {
  if (!subscription.startDate || !subscription.endDate) {
    return false
  }

  return subscription.startDate <= today && subscription.endDate >= today
}

function noMembershipReason(subscriptions: Subscription[]): string {
  if (subscriptions.some((subscription) => subscription.status === 'PENDING')) {
    return 'La suscripción del cliente está pendiente de pago. Confirma el pago antes de registrar la entrada.'
  }

  if (subscriptions.some((subscription) => subscription.status === 'ACTIVE')) {
    return 'La suscripción marcada como activa está fuera de su periodo de vigencia.'
  }

  if (subscriptions.length === 0) {
    return 'El cliente no tiene suscripciones registradas. Contrata una membresía antes de registrar la entrada.'
  }

  return 'El cliente no tiene una membresía vigente. Renueva o contrata una suscripción antes de registrar la entrada.'
}

export function AttendanceCheckInPanel({
  clientId,
  client,
  selfService = false,
}: AttendanceCheckInPanelProps) {
  const today = todayDateString()
  const subscriptionsQuery = useClientSubscriptions(clientId)
  const subscriptions = subscriptionsQuery.data ?? []
  const activeSubscription = useMemo(
    () =>
      subscriptions.find(
        (subscription) =>
          subscription.status === 'ACTIVE' && hasCurrentDates(subscription, today),
      ),
    [subscriptions, today],
  )
  const membershipQuery = useMembership(
    activeSubscription?.membershipId ?? 0,
    activeSubscription !== undefined,
  )
  const openQuery = useAttendance({ clientId, open: true, page: 1, limit: 1 })
  const currentOpen = openQuery.data?.items[0] ?? null
  const checkInMutation = useCheckIn()
  const checkOutMutation = useCheckOut()
  const [actionError, setActionError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const isPending = checkInMutation.isPending || checkOutMutation.isPending
  const isInactive = client?.isActive === false
  const rejectionReason = isInactive
    ? 'El cliente está inactivo. Actívalo antes de registrar la entrada.'
    : activeSubscription
      ? null
      : noMembershipReason(subscriptions)
  const canCheckIn = !isInactive && activeSubscription !== undefined && currentOpen === null
  const title = selfService
    ? 'Mi membresía'
    : client
      ? `${client.name} ${client.lastName}`
      : 'Estado de acceso'

  const runCheckIn = async () => {
    setActionError(null)
    setSuccessMessage(null)

    try {
      await checkInMutation.mutateAsync({ clientId: selfService ? undefined : clientId })
      setSuccessMessage('Entrada registrada correctamente.')
    } catch (error: unknown) {
      setActionError(attendanceErrorMessage(error, 'No fue posible registrar la entrada.'))
    }
  }

  const runCheckOut = async () => {
    if (!currentOpen) {
      return
    }

    setActionError(null)
    setSuccessMessage(null)

    try {
      await checkOutMutation.mutateAsync(currentOpen.id)
      setSuccessMessage('Salida registrada correctamente.')
    } catch (error: unknown) {
      setActionError(attendanceErrorMessage(error, 'No fue posible registrar la salida.'))
    }
  }

  return (
    <Panel
      title={title}
      subtitle={
        selfService
          ? 'Consulta tu membresía y registra tu entrada o salida.'
          : 'Membresía vigente y sesión actual del cliente.'
      }
    >
      <Stack spacing={1.75} sx={{ mt: 2 }}>
        {client && (
          <Stack sx={{ flexDirection: 'row', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <StatusBadge
              label={client.isActive ? 'Cliente activo' : 'Cliente inactivo'}
              status={client.isActive ? 'success' : 'error'}
            />
            <Typography variant="body2" color="text.secondary">
              {client.dni} · {client.email}
            </Typography>
          </Stack>
        )}

        {actionError && <Alert severity="error">{actionError}</Alert>}
        {successMessage && <Alert severity="success">{successMessage}</Alert>}

        {subscriptionsQuery.isLoading && (
          <LoadingState label="Cargando membresía..." />
        )}
        {subscriptionsQuery.isError && (
          <ErrorState
            message={queryErrorMessage(
              subscriptionsQuery.error,
              'No fue posible cargar la membresía del cliente.',
            )}
          />
        )}

        {subscriptionsQuery.isSuccess && activeSubscription && (
          <Stack spacing={1.25}>
            <Stack sx={{ flexDirection: 'row', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <StatusBadge label="Membresía activa" status="success" />
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {membershipQuery.data?.name ?? `Membresía #${activeSubscription.membershipId}`}
              </Typography>
            </Stack>
            <Divider />
            <Typography variant="body2" color="text.secondary">
              Inicio: {formatDate(activeSubscription.startDate)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Vence: {formatDate(activeSubscription.endDate)}
            </Typography>
            {membershipQuery.data?.maxDaysPerWeek !== null &&
              membershipQuery.data?.maxDaysPerWeek !== undefined && (
                <Typography variant="body2" color="text.secondary">
                  Límite semanal: {membershipQuery.data.maxDaysPerWeek} días
                </Typography>
              )}
          </Stack>
        )}

        {subscriptionsQuery.isSuccess && rejectionReason && (
          <Alert severity="warning">{rejectionReason}</Alert>
        )}

        {openQuery.isLoading && !currentOpen && (
          <Typography variant="body2" color="text.secondary">
            Consultando sesión abierta...
          </Typography>
        )}
        {openQuery.isError && (
          <ErrorState
            message={queryErrorMessage(
              openQuery.error,
              'No fue posible consultar la sesión abierta.',
            )}
          />
        )}
        {currentOpen && (
          <>
            <Alert severity="info">
              Sesión abierta desde {formatDateTime(currentOpen.checkInAt)} ·{' '}
              {formatDuration(currentOpen.checkInAt, null)} en curso.
            </Alert>
            <Button
              variant="contained"
              color="warning"
              onClick={() => { void runCheckOut() }}
              disabled={isPending}
            >
              {checkOutMutation.isPending ? 'Registrando salida...' : 'Registrar salida'}
            </Button>
          </>
        )}

        {!currentOpen && (
          <Button
            variant="contained"
            onClick={() => { void runCheckIn() }}
            disabled={!canCheckIn || isPending || openQuery.isLoading}
          >
            {checkInMutation.isPending ? 'Registrando entrada...' : 'Registrar entrada'}
          </Button>
        )}
      </Stack>
    </Panel>
  )
}
