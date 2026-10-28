import { Grid, Stack, TableCell, TableRow, Typography } from '@mui/material'
import { EmptyState, ErrorState, LoadingState } from '../../../components/feedback/States'
import { DataTable } from '../../../components/ui/DataTable'
import { Panel } from '../../../components/ui/Panel'
import { StatusBadge } from '../../../components/ui/StatusBadge'
import { HttpError } from '../../../lib/http'
import { formatDate, formatDateTime } from '../../../utils/format'
import { useClientAttendance, useClientProgress, useClientSubscriptions } from '../hooks'
import type { ProgressRecord, SubscriptionStatus } from '../summary'

interface ClientOperationalSummaryProps {
  clientId: number
  canViewMembership: boolean
  canViewAttendance: boolean
  canViewProgress: boolean
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof HttpError || error instanceof Error ? error.message : fallback
}

function subscriptionStatusMeta(status: SubscriptionStatus): {
  label: string
  tone: 'success' | 'pending' | 'error' | 'info'
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

function formatMetric(value: number | null, unit: string): string {
  return value === null
    ? '—'
    : `${value.toLocaleString('es-MX', { maximumFractionDigits: 2 })} ${unit}`
}

export function ClientOperationalSummary({
  clientId,
  canViewMembership,
  canViewAttendance,
  canViewProgress,
}: ClientOperationalSummaryProps) {
  return (
    <Stack spacing={2}>
      {canViewMembership && <MembershipPanel clientId={clientId} />}
      {canViewAttendance && <AttendancePanel clientId={clientId} />}
      {canViewProgress && <ProgressPanel clientId={clientId} />}
    </Stack>
  )
}

function MembershipPanel({ clientId }: { clientId: number }) {
  const query = useClientSubscriptions(clientId)
  const latest = query.data?.[0]
  const active = query.data?.find((subscription) => subscription.status === 'ACTIVE')
  const subscription = active ?? latest

  return (
    <Panel title="Membresía" subtitle="Suscripción más reciente">
      {query.isLoading && <LoadingState label="Cargando membresía..." />}
      {query.isError && (
        <ErrorState message={getErrorMessage(query.error, 'No fue posible cargar la membresía.')} />
      )}
      {query.isSuccess && !subscription && (
        <EmptyState message="El cliente no tiene suscripciones registradas." />
      )}
      {subscription && (
        <Stack spacing={1.25} sx={{ mt: 2 }}>
          <Stack sx={{ flexDirection: 'row', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <StatusBadge
              label={subscriptionStatusMeta(subscription.status).label}
              status={subscriptionStatusMeta(subscription.status).tone}
            />
            <Typography variant="body2">Membresía #{subscription.membershipId}</Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary">
            Inicio: {formatDate(subscription.startDate)}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Vence: {formatDate(subscription.endDate)}
          </Typography>
          {active && latest && active.id !== latest.id && (
            <Typography variant="caption" color="text.secondary">
              Última contratación: {formatDate(latest.createdAt)}
            </Typography>
          )}
        </Stack>
      )}
    </Panel>
  )
}

function AttendancePanel({ clientId }: { clientId: number }) {
  const query = useClientAttendance(clientId)

  return (
    <Panel
      title="Asistencia"
      subtitle={
        query.data
          ? `${query.data.total} registros en total`
          : 'Últimos registros del cliente'
      }
    >
      {query.isLoading && <LoadingState label="Cargando asistencia..." />}
      {query.isError && (
        <ErrorState message={getErrorMessage(query.error, 'No fue posible cargar la asistencia.')} />
      )}
      {query.isSuccess && query.data.items.length === 0 && (
        <EmptyState message="El cliente no tiene asistencias registradas." />
      )}
      {query.isSuccess && query.data.items.length > 0 && (
        <DataTable headers={['ENTRADA', 'SALIDA', 'ESTADO']} minWidth={420}>
          {query.data.items.map((attendance) => (
            <TableRow key={attendance.id}>
              <TableCell>{formatDateTime(attendance.checkInAt)}</TableCell>
              <TableCell>{formatDateTime(attendance.checkOutAt)}</TableCell>
              <TableCell>
                <StatusBadge
                  label={attendance.checkOutAt ? 'Cerrada' : 'En curso'}
                  status={attendance.checkOutAt ? 'success' : 'pending'}
                />
              </TableCell>
            </TableRow>
          ))}
        </DataTable>
      )}
    </Panel>
  )
}

function ProgressPanel({ clientId }: { clientId: number }) {
  const query = useClientProgress(clientId)
  const latest = query.data?.items[0]

  return (
    <Panel title="Progreso" subtitle="Última medición registrada">
      {query.isLoading && <LoadingState label="Cargando progreso..." />}
      {query.isError && (
        <ErrorState message={getErrorMessage(query.error, 'No fue posible cargar el progreso.')} />
      )}
      {query.isSuccess && !latest && (
        <EmptyState message="El cliente no tiene mediciones de progreso." />
      )}
      {latest && <ProgressDetails record={latest} />}
    </Panel>
  )
}

function ProgressDetails({ record }: { record: ProgressRecord }) {
  return (
    <>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
        Medición del {formatDate(record.measuredAt)}
      </Typography>
      <Grid container spacing={1.5} sx={{ mt: 0.5 }}>
        <Metric label="Peso" value={formatMetric(record.weightKg, 'kg')} />
        <Metric label="Altura" value={formatMetric(record.heightCm, 'cm')} />
        <Metric label="Grasa corporal" value={formatMetric(record.bodyFatPct, '%')} />
        <Metric label="Músculo" value={formatMetric(record.muscleKg, 'kg')} />
        <Metric label="Cintura" value={formatMetric(record.waistCm, 'cm')} />
        <Metric label="Cadera" value={formatMetric(record.hipCm, 'cm')} />
      </Grid>
      {record.notes && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
          {record.notes}
        </Typography>
      )}
    </>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <Grid size={{ xs: 6, sm: 4 }}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2">{value}</Typography>
    </Grid>
  )
}
