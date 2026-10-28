import { Alert, Grid, Stack } from '@mui/material'
import { useMemo, useState } from 'react'
import { EmptyState, ErrorState, LoadingState } from '../../../components/feedback/States'
import { AppShell } from '../../../components/layout/AppShell'
import { PageHeader } from '../../../components/layout/PageHeader'
import { HttpError } from '../../../lib/http'
import { canViewStats, useAuth } from '../../auth'
import { CoachUsageTable } from '../components/CoachUsageTable'
import { PaymentsBreakdown } from '../components/PaymentsBreakdown'
import { ReportsPanel } from '../components/ReportsPanel'
import { StatsFilters, type StatsPeriod } from '../components/StatsFilters'
import { StatsKpis } from '../components/StatsKpis'
import { useStats } from '../hooks'
import type { StatsFilters as StatsFiltersValue } from '../types'

function inputDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function rangeFor(days: number): { from: string; to: string } {
  const to = new Date()
  const from = new Date(to)
  from.setDate(from.getDate() - days)

  return { from: inputDate(from), to: inputDate(to) }
}

function getErrorMessage(error: unknown): string {
  return error instanceof HttpError || error instanceof Error
    ? error.message
    : 'No fue posible cargar las estadísticas.'
}

export function StatsPage() {
  const { user } = useAuth()
  const [period, setPeriod] = useState<StatsPeriod>('30')
  const [range, setRange] = useState(() => rangeFor(30))
  const invalidRange = !range.from || !range.to || range.from > range.to
  const allowed = canViewStats(user?.role)
  const filters = useMemo<StatsFiltersValue>(
    () => ({
      from: range.from,
      to: range.to,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    }),
    [range],
  )
  const statsQuery = useStats(user?.role, filters, !invalidRange)

  const handlePeriodChange = (value: StatsPeriod): void => {
    setPeriod(value)

    if (value !== 'custom') {
      setRange(rangeFor(Number(value)))
    }
  }

  const handleFromChange = (value: string): void => {
    setPeriod('custom')
    setRange((current) => ({ ...current, from: value }))
  }

  const handleToChange = (value: string): void => {
    setPeriod('custom')
    setRange((current) => ({ ...current, to: value }))
  }

  if (!allowed) {
    return (
      <AppShell>
        <PageHeader
          eyebrow="Analítica"
          title="Estadísticas"
          subtitle="Indicadores administrativos y reportes del gimnasio."
        />
        <EmptyState message="Las estadísticas están disponibles para administración y recepción." />
      </AppShell>
    )
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow="Analítica"
        title="Estadísticas"
        subtitle="Consulta indicadores, actividad de entrenadores y reportes administrativos."
      />
      <Stack spacing={2.25}>
        <StatsFilters
          period={period}
          from={range.from}
          to={range.to}
          invalidRange={invalidRange}
          isFetching={statsQuery.isFetching}
          onPeriodChange={handlePeriodChange}
          onFromChange={handleFromChange}
          onToChange={handleToChange}
          onRefresh={() => void statsQuery.refetch()}
        />
        {invalidRange && (
          <Alert severity="warning">
            Selecciona un rango válido: la fecha inicial no puede ser posterior a la final.
          </Alert>
        )}
        {statsQuery.isLoading && <LoadingState label="Cargando estadísticas..." />}
        {statsQuery.isError && <ErrorState message={getErrorMessage(statsQuery.error)} />}
        {statsQuery.data && (
          <>
            <StatsKpis stats={statsQuery.data} />
            <Grid container spacing={2.25}>
              <Grid size={{ xs: 12, lg: 6 }}>
                <PaymentsBreakdown
                  payments={statsQuery.data.payments}
                  currency={statsQuery.data.revenue.currency}
                />
              </Grid>
              <Grid size={{ xs: 12, lg: 6 }}>
                <CoachUsageTable coaches={statsQuery.data.coachUsage} />
              </Grid>
            </Grid>
          </>
        )}
        <ReportsPanel filters={filters} disabled={invalidRange} />
      </Stack>
    </AppShell>
  )
}
