import { Button, Chip, Grid, Stack, TableCell, TableRow, Typography } from '@mui/material'
import { AppShell } from '../../../components/layout/AppShell'
import { PageHeader } from '../../../components/layout/PageHeader'
import { DataTable } from '../../../components/ui/DataTable'
import { KpiCard } from '../../../components/ui/KpiCard'
import { Panel } from '../../../components/ui/Panel'
import { StatusBadge } from '../../../components/ui/StatusBadge'
import { Icon } from '../../../components/ui/Icon'

const renewals = [
  ['CM', 'Carla Mendoza', 'Premium · vence en 2 días', '$89', 'primary'],
  ['JP', 'Jorge Pérez', 'Gold · vence en 3 días', '$59', 'warning'],
  ['SL', 'Sofía López', 'Premium · vence en 5 días', '$89', 'info'],
  ['DG', 'Diego García', 'Basic · vence en 6 días', '$39', 'success'],
] as const

export function DashboardPage() {
  return (
    <AppShell role="ADMIN">
      <PageHeader
        eyebrow="Resumen general"
        title="Buenos días, Alex ✦"
        subtitle="Aquí tienes lo que está pasando hoy en tu gimnasio."
        actions={<><Button variant="outlined">↓ Exportar</Button><Button variant="contained">+ Nuevo cliente</Button></>}
      />

      <Grid container spacing={2} sx={{ mb: 2.25 }}>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}><KpiCard icon={<Icon name="clients" />} color="primary" trend="+12.5%" label="Clientes activos" value="1,248" detail="vs. mes anterior" /></Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}><KpiCard icon={<Icon name="money" />} color="warning" trend="+8.2%" label="Ingresos este mes" value="$24,680" detail="vs. mes anterior" /></Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}><KpiCard icon={<Icon name="attendance" />} color="info" trend="+4.8%" label="Asistencias hoy" value="186" detail="de 220 esperadas" /></Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}><KpiCard icon={<Icon name="progress" />} color="success" trend="14 pendientes" label="Renovaciones próximas" value="32" detail="en los próximos 7 días" warning /></Grid>
      </Grid>

      <Grid container spacing={2.25} sx={{ mb: 2.25 }}>
        <Grid size={{ xs: 12, lg: 7 }}><AttendancePanel /></Grid>
        <Grid size={{ xs: 12, lg: 5 }}><RenewalsPanel /></Grid>
      </Grid>

      <Panel title="Actividad reciente" subtitle="Últimas operaciones del sistema" action={<Button size="small" variant="outlined">Últimos 7 días⌄</Button>}>
        <DataTable headers={['CLIENTE', 'ACTIVIDAD', 'FECHA', 'ESTADO', '']}>
          <ActivityRow initials="CM" name="Carla Mendoza" activity="Renovó su membresía Premium" date="Hoy, 10:42 AM" status="Completado" statusType="success" />
          <ActivityRow initials="JP" name="Jorge Pérez" activity="Registró asistencia" date="Hoy, 09:18 AM" status="Completado" statusType="success" />
          <ActivityRow initials="SL" name="Sofía López" activity="Pago pendiente generado" date="Ayer, 04:32 PM" status="Pendiente" statusType="pending" />
        </DataTable>
      </Panel>
    </AppShell>
  )
}

function AttendancePanel() {
  return (
    <Panel title="Asistencia de hoy" subtitle="Ingresos registrados durante el día" action={<Button size="small">Ver todo →</Button>}>
      <Stack sx={{ flexDirection: 'row', gap: 2, alignItems: 'center', my: 3 }}>
        <Stack sx={{ alignItems: 'center', justifyContent: 'center', width: 83, height: 83, borderRadius: '50%', border: '10px solid', borderColor: 'primary.main', flexShrink: 0 }}>
          <Typography variant="h6">84<small>%</small></Typography>
        </Stack>
        <div>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>186 check-ins</Typography>
          <Typography variant="body2" color="text.secondary">de 220 miembros esperados</Typography>
          <Typography variant="caption" color="success.light">● 84% de ocupación</Typography>
        </div>
      </Stack>
      <Stack sx={{ flexDirection: 'row', gap: 1, alignItems: 'flex-end', height: 85 }}>
        {[28, 40, 35, 52, 67, 48, 82, 61, 45, 32, 25, 20].map((height, index) => <Stack key={index} sx={{ height: `${height}%`, flex: 1, bgcolor: index === 6 ? 'primary.light' : 'primary.dark', borderRadius: '3px 3px 0 0' }} />)}
      </Stack>
      <Stack sx={{ flexDirection: 'row', justifyContent: 'space-between', mt: 1 }}><Typography variant="caption">6 AM</Typography><Typography variant="caption">9 AM</Typography><Typography variant="caption">12 PM</Typography><Typography variant="caption">3 PM</Typography><Typography variant="caption">6 PM</Typography><Typography variant="caption">9 PM</Typography></Stack>
    </Panel>
  )
}

function RenewalsPanel() {
  return (
    <Panel title="Renovaciones próximas" subtitle="Requieren atención esta semana" action={<Button size="small">•••</Button>}>
      <Stack sx={{ mt: 1.5 }}>
        {renewals.map(([initials, name, description, amount, color]) => (
          <Stack key={name} sx={{ flexDirection: 'row', alignItems: 'center', gap: 1.25, py: 1.25, borderBottom: 1, borderColor: 'divider' }}>
            <Chip label={initials} color={color} sx={{ width: 34, height: 34, borderRadius: '50%' }} />
            <Stack sx={{ flex: 1 }}><Typography variant="body2" sx={{ fontWeight: 600 }}>{name}</Typography><Typography variant="caption" color="text.secondary">{description}</Typography></Stack>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>{amount}</Typography>
          </Stack>
        ))}
      </Stack>
      <Button fullWidth variant="outlined" sx={{ mt: 2 }}>Ver todas las renovaciones</Button>
    </Panel>
  )
}

function ActivityRow({ initials, name, activity, date, status, statusType }: { initials: string; name: string; activity: string; date: string; status: string; statusType: 'success' | 'pending' }) {
  return (
    <TableRow>
      <TableCell><Chip label={initials} size="small" color="primary" sx={{ mr: 1 }} />{name}</TableCell>
      <TableCell>{activity}</TableCell>
      <TableCell>{date}</TableCell>
      <TableCell><StatusBadge label={status} status={statusType} /></TableCell>
      <TableCell>•••</TableCell>
    </TableRow>
  )
}
