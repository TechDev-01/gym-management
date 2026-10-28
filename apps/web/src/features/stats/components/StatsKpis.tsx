import { Grid } from '@mui/material'
import { KpiCard } from '../../../components/ui/KpiCard'
import { Icon } from '../../../components/ui/Icon'
import { formatCurrency } from '../../../utils/format'
import type { StatsData } from '../types'

export function StatsKpis({ stats }: { stats: StatsData }) {
  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
        <KpiCard
          icon={<Icon name="clients" />}
          color="primary"
          trend="Periodo actual"
          label="Clientes activos"
          value={stats.clients.active.toLocaleString('es-MX')}
          detail={`${stats.memberships.active.toLocaleString('es-MX')} membresías activas`}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
        <KpiCard
          icon={<Icon name="money" />}
          color="warning"
          trend={stats.revenue.currency ?? 'USD'}
          label="Ingresos"
          value={formatCurrency(stats.revenue.amount, stats.revenue.currency ?? 'USD')}
          detail={`${stats.period.from} al ${stats.period.to}`}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
        <KpiCard
          icon={<Icon name="attendance" />}
          color="info"
          trend="Total"
          label="Asistencias"
          value={stats.attendance.total.toLocaleString('es-MX')}
          detail={`${stats.period.from} al ${stats.period.to}`}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
        <KpiCard
          icon={<Icon name="progress" />}
          color="success"
          trend="Atención"
          label="Membresías vencidas"
          value={stats.memberships.expired.toLocaleString('es-MX')}
          detail="Revisar renovaciones"
          warning={stats.memberships.expired > 0}
        />
      </Grid>
    </Grid>
  )
}
