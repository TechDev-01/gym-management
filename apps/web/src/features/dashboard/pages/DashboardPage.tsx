import { Button, Chip, Grid, MenuItem, Stack, TableCell, TableRow, TextField, Typography } from '@mui/material'
import { useMemo, useState } from 'react'
import { AppShell } from '../../../components/layout/AppShell'
import { ErrorState, LoadingState, EmptyState } from '../../../components/feedback/States'
import { PageHeader } from '../../../components/layout/PageHeader'
import { DataTable } from '../../../components/ui/DataTable'
import { KpiCard } from '../../../components/ui/KpiCard'
import { Panel } from '../../../components/ui/Panel'
import { StatusBadge } from '../../../components/ui/StatusBadge'
import { Icon } from '../../../components/ui/Icon'
import { HttpError } from '../../../lib/http'
import { useAuth } from '../../auth'
import { useDashboardStats } from '../hooks'
import type { DashboardStats } from '../types'

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function formatCurrency(amount: number, currency: string | null): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: currency ?? 'USD',
    maximumFractionDigits: 2,
  }).format(amount)
}

function getErrorMessage(error: unknown): string {
  return error instanceof HttpError || error instanceof Error
    ? error.message
    : 'No fue posible cargar el dashboard.'
}

export function DashboardPage() {
  const { user } = useAuth()
  const [period, setPeriod] = useState('30')
  const [refreshKey, setRefreshKey] = useState(0)
  const filters = useMemo(() => {
    const to = new Date()
    const from = new Date(to)
    from.setDate(from.getDate() - Number(period))

    return {
      from: formatDate(from),
      to: formatDate(to),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    }
  }, [period, refreshKey])
  const dashboardQuery = useDashboardStats(user?.role, filters)
  const stats = dashboardQuery.data
  const canViewStats = user?.role === 'ADMIN' || user?.role === 'RECEPTION'

  return (
    <AppShell>
      <PageHeader
        eyebrow="Resumen general"
        title={`Buenos días, ${user?.email.split('@')[0] ?? 'usuario'} ✦`}
        subtitle="Aquí tienes lo que está pasando hoy en tu gimnasio."
        actions={canViewStats ? (
          <Stack sx={{ flexDirection: 'row', gap: 1 }}>
            <TextField
              select
              size="small"
              label="Periodo"
              value={period}
              onChange={(event) => setPeriod(event.target.value)}
            >
              <MenuItem value="7">Últimos 7 días</MenuItem>
              <MenuItem value="30">Últimos 30 días</MenuItem>
              <MenuItem value="90">Últimos 90 días</MenuItem>
            </TextField>
            <Button variant="outlined" onClick={() => setRefreshKey((value) => value + 1)} disabled={dashboardQuery.isFetching}>
              {dashboardQuery.isFetching ? 'Actualizando...' : 'Actualizar'}
            </Button>
          </Stack>
        ) : undefined}
      />

      {!canViewStats && <EmptyState message="Las estadísticas del dashboard están disponibles para administración y recepción." />}
      {canViewStats && dashboardQuery.isLoading && <LoadingState label="Cargando métricas..." />}
      {canViewStats && dashboardQuery.isError && <ErrorState message={getErrorMessage(dashboardQuery.error)} />}
      {canViewStats && stats && <DashboardContent stats={stats} />}
    </AppShell>
  )
}

function DashboardContent({ stats }: { stats: DashboardStats }) {
  return (
    <>
      <Grid container spacing={2} sx={{ mb: 2.25 }}>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}><KpiCard icon={<Icon name="clients" />} color="primary" trend="Periodo actual" label="Clientes activos" value={stats.clients.active.toLocaleString('es-MX')} detail={`${stats.memberships.active.toLocaleString('es-MX')} membresías activas`} /></Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}><KpiCard icon={<Icon name="money" />} color="warning" trend={stats.revenue.currency ?? 'USD'} label="Ingresos" value={formatCurrency(stats.revenue.amount, stats.revenue.currency)} detail={`${stats.period.from} al ${stats.period.to}`} /></Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}><KpiCard icon={<Icon name="attendance" />} color="info" trend="Total" label="Asistencias" value={stats.attendance.total.toLocaleString('es-MX')} detail={`${stats.period.from} al ${stats.period.to}`} /></Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}><KpiCard icon={<Icon name="progress" />} color="success" trend="Atención" label="Membresías vencidas" value={stats.memberships.expired.toLocaleString('es-MX')} detail="Revisar renovaciones" warning={stats.memberships.expired > 0} /></Grid>
      </Grid>

      <Grid container spacing={2.25}>
        <Grid size={{ xs: 12, lg: 6 }}><PaymentsPanel payments={stats.payments} /></Grid>
        <Grid size={{ xs: 12, lg: 6 }}><CoachUsagePanel coaches={stats.coachUsage} /></Grid>
      </Grid>
    </>
  )
}

function PaymentsPanel({ payments }: { payments: DashboardStats['payments'] }) {
  return (
    <Panel title="Pagos" subtitle="Resumen por estado en el periodo seleccionado">
      {payments.length === 0 ? <EmptyState message="No hay pagos para este periodo." /> : (
        <DataTable headers={['ESTADO', 'OPERACIONES', 'IMPORTE']}>
          {payments.map((payment) => (
            <TableRow key={payment.status}>
              <TableCell><StatusBadge label={payment.status} status={payment.status.toLowerCase() === 'succeeded' ? 'success' : 'pending'} /></TableCell>
              <TableCell>{payment.count.toLocaleString('es-MX')}</TableCell>
              <TableCell>{formatCurrency(payment.amount, null)}</TableCell>
            </TableRow>
          ))}
        </DataTable>
      )}
    </Panel>
  )
}

function CoachUsagePanel({ coaches }: { coaches: DashboardStats['coachUsage'] }) {
  return (
    <Panel title="Uso de entrenadores" subtitle="Actividad registrada en el periodo seleccionado">
      {coaches.length === 0 ? <EmptyState message="No hay actividad de entrenadores para este periodo." /> : (
        <Stack>
          {coaches.map((coach) => (
            <Stack key={coach.coachId} sx={{ flexDirection: 'row', alignItems: 'center', gap: 1.25, py: 1.25, borderBottom: 1, borderColor: 'divider' }}>
              <Chip label={coach.coachName.slice(0, 2).toUpperCase()} color="primary" sx={{ width: 34, height: 34, borderRadius: '50%' }} />
              <Stack sx={{ flex: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>{coach.coachName}</Typography>
                <Typography variant="caption" color="text.secondary">{coach.routinesCreated} rutinas · {coach.routineAssignments} asignaciones · {coach.progressRecords} progresos</Typography>
              </Stack>
            </Stack>
          ))}
        </Stack>
      )}
    </Panel>
  )
}
