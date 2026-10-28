import {
  Alert,
  Button,
  Grid,
  Stack,
  TableCell,
  TableRow,
  Typography,
} from '@mui/material'
import { useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { EmptyState, ErrorState, LoadingState } from '../../../components/feedback/States'
import { AppShell } from '../../../components/layout/AppShell'
import { PageHeader } from '../../../components/layout/PageHeader'
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog'
import { DataTable } from '../../../components/ui/DataTable'
import { Panel } from '../../../components/ui/Panel'
import { StatusBadge } from '../../../components/ui/StatusBadge'
import { HttpError } from '../../../lib/http'
import { formatCurrency, formatDate, formatDateTime } from '../../../utils/format'
import { canManageSubscriptions, useAuth } from '../../auth'
import { useClient } from '../../clients/hooks'
import { usePayments } from '../../payments/hooks'
import { paymentMethodLabel, paymentStatusMeta } from '../../payments/status'
import { useCancelSubscription, useConfirmManualPayment, useMembership, useSubscription } from '../hooks'
import { subscriptionStatusMeta } from '../status'

type PendingAction = 'cancel' | 'confirm' | null

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof HttpError || error instanceof Error ? error.message : fallback
}

export function SubscriptionDetailPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { id = '' } = useParams()
  const subscriptionId = Number(id)
  const subscriptionQuery = useSubscription(subscriptionId)
  const subscription = subscriptionQuery.data
  const canManage = canManageSubscriptions(user?.role)
  const membershipQuery = useMembership(subscription?.membershipId ?? 0, subscription !== undefined)
  const clientQuery = useClient(subscription?.clientId ?? 0, canManage && subscription !== undefined)
  const paymentsQuery = usePayments({ subscriptionId }, canManage && subscription !== undefined)
  const cancelMutation = useCancelSubscription(subscriptionId)
  const confirmMutation = useConfirmManualPayment(subscriptionId)
  const [pendingAction, setPendingAction] = useState<PendingAction>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(
    (location.state as { message?: string } | null)?.message ?? null,
  )
  const isPending = cancelMutation.isPending || confirmMutation.isPending

  if (subscriptionQuery.isLoading) {
    return (
      <AppShell>
        <LoadingState label="Cargando suscripción..." />
      </AppShell>
    )
  }

  if (subscriptionQuery.isError || !subscription) {
    return (
      <AppShell>
        <ErrorState
          message={
            subscriptionQuery.error instanceof Error
              ? subscriptionQuery.error.message
              : 'No fue posible cargar la suscripción.'
          }
        />
      </AppShell>
    )
  }

  const statusMeta = subscriptionStatusMeta(subscription.status)
  const canCancel = canManage && (subscription.status === 'ACTIVE' || subscription.status === 'PENDING')
  const canConfirm = canManage && subscription.status === 'PENDING'
  const clientName = clientQuery.data
    ? `${clientQuery.data.name} ${clientQuery.data.lastName}`
    : `Cliente #${subscription.clientId}`

  const runAction = async () => {
    if (!pendingAction) return

    setActionError(null)

    try {
      if (pendingAction === 'cancel') {
        await cancelMutation.mutateAsync()
        setSuccessMessage('Suscripción cancelada correctamente.')
      } else {
        await confirmMutation.mutateAsync()
        setSuccessMessage('Pago manual confirmado y suscripción activada.')
      }
    } catch (error: unknown) {
      setActionError(
        errorMessage(
          error,
          pendingAction === 'cancel'
            ? 'No fue posible cancelar la suscripción.'
            : 'No fue posible confirmar el pago.',
        ),
      )
    } finally {
      setPendingAction(null)
    }
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow="Detalle de suscripción"
        title={`Suscripción #${subscription.id}`}
        subtitle={membershipQuery.data?.name ?? `Membresía #${subscription.membershipId}`}
        actions={
          <Button
            variant="outlined"
            onClick={() => { void subscriptionQuery.refetch() }}
            disabled={subscriptionQuery.isFetching}
          >
            Actualizar estado
          </Button>
        }
      />
      <Stack spacing={2}>
        {successMessage && (
          <Alert severity="success" onClose={() => setSuccessMessage(null)}>
            {successMessage}
          </Alert>
        )}
        {actionError && <Alert severity="error">{actionError}</Alert>}
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 7 }}>
            <Panel title="Estado de la suscripción">
              <Stack spacing={1.5} sx={{ mt: 2 }}>
                <Stack sx={{ flexDirection: 'row', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                  <StatusBadge label={statusMeta.label} status={statusMeta.tone} />
                  {subscription.status === 'PENDING' && (
                    <Typography variant="caption" color="text.secondary">
                      Pendiente de pago o confirmación.
                    </Typography>
                  )}
                </Stack>
                <Typography>Cliente: {clientName}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Inicio: {formatDate(subscription.startDate)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Vence: {formatDate(subscription.endDate)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Creada: {formatDateTime(subscription.createdAt)}
                </Typography>
              </Stack>
              {(canCancel || canConfirm) && (
                <Stack sx={{ flexDirection: 'row', gap: 1, flexWrap: 'wrap', mt: 3 }}>
                  {canConfirm && (
                    <Button
                      variant="contained"
                      onClick={() => setPendingAction('confirm')}
                      disabled={isPending}
                    >
                      Confirmar pago manual
                    </Button>
                  )}
                  {canCancel && (
                    <Button
                      color="error"
                      variant="outlined"
                      onClick={() => setPendingAction('cancel')}
                      disabled={isPending}
                    >
                      Cancelar suscripción
                    </Button>
                  )}
                </Stack>
              )}
            </Panel>
          </Grid>
          <Grid size={{ xs: 12, md: 5 }}>
            <Panel title="Membresía contratada">
              {membershipQuery.isLoading && <LoadingState label="Cargando membresía..." />}
              {membershipQuery.isError && (
                <ErrorState
                  message={errorMessage(
                    membershipQuery.error,
                    'No fue posible cargar la membresía.',
                  )}
                />
              )}
              {membershipQuery.data && (
                <Stack spacing={1.25} sx={{ mt: 2 }}>
                  <Typography>{membershipQuery.data.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {membershipQuery.data.durationDays} días ·{' '}
                    {membershipQuery.data.maxDaysPerWeek
                      ? `${membershipQuery.data.maxDaysPerWeek} días por semana`
                      : 'Acceso ilimitado'}
                  </Typography>
                  <Typography variant="h6">
                    {formatCurrency(
                      membershipQuery.data.priceAmount,
                      membershipQuery.data.currency,
                    )}
                  </Typography>
                </Stack>
              )}
            </Panel>
          </Grid>
        </Grid>
        {canManage && (
          <Panel title="Pagos" subtitle="Historial de pagos de esta suscripción">
            {paymentsQuery.isLoading && <LoadingState label="Cargando pagos..." />}
            {paymentsQuery.isError && (
              <ErrorState
                message={errorMessage(
                  paymentsQuery.error,
                  'No fue posible cargar los pagos.',
                )}
              />
            )}
            {paymentsQuery.isSuccess && paymentsQuery.data.length === 0 && (
              <EmptyState message="La suscripción no tiene pagos registrados." />
            )}
            {paymentsQuery.isSuccess && paymentsQuery.data.length > 0 && (
              <DataTable
                headers={['MÉTODO', 'IMPORTE', 'ESTADO', 'PAGADO', 'RECIBO']}
                minWidth={620}
              >
                {paymentsQuery.data.map((payment) => {
                  const paymentStatus = paymentStatusMeta(payment.status)
                  return (
                    <TableRow key={payment.id}>
                      <TableCell>{paymentMethodLabel(payment.method)}</TableCell>
                      <TableCell>{formatCurrency(payment.amount, payment.currency)}</TableCell>
                      <TableCell>
                        <StatusBadge label={paymentStatus.label} status={paymentStatus.tone} />
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
          </Panel>
        )}
        <Stack sx={{ flexDirection: 'row', justifyContent: 'flex-start' }}>
          <Button onClick={() => navigate('/subscriptions')}>Volver a suscripciones</Button>
        </Stack>
      </Stack>
      <ConfirmDialog
        open={pendingAction !== null}
        title={pendingAction === 'cancel' ? 'Cancelar suscripción' : 'Confirmar pago manual'}
        description={
          pendingAction === 'cancel'
            ? `La suscripción #${subscription.id} quedará cancelada. Esta acción no se puede deshacer.`
            : `Se marcará el pago de la suscripción #${subscription.id} como confirmado y se activará el plan. Confirma solo si verificaste el pago fuera del sistema.`
        }
        confirmLabel={pendingAction === 'cancel' ? 'Cancelar suscripción' : 'Confirmar pago'}
        loading={isPending}
        onConfirm={() => { void runAction() }}
        onClose={() => setPendingAction(null)}
      />
    </AppShell>
  )
}
