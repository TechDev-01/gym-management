import { Alert, Button, Grid, Stack, Typography } from '@mui/material'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { ErrorState, LoadingState } from '../../../components/feedback/States'
import { AppShell } from '../../../components/layout/AppShell'
import { PageHeader } from '../../../components/layout/PageHeader'
import { Panel } from '../../../components/ui/Panel'
import { StatusBadge } from '../../../components/ui/StatusBadge'
import { canManageCoaches, useAuth } from '../../auth'
import { useCoach } from '../hooks'

export function CoachDetailPage() {
  const { user } = useAuth()
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const coachId = Number(id)
  const query = useCoach(coachId)
  const coach = query.data
  const message = (location.state as { message?: string } | null)?.message
  const canManage = canManageCoaches(user?.role)

  if (query.isLoading) {
    return (
      <AppShell>
        <LoadingState label="Cargando entrenador..." />
      </AppShell>
    )
  }

  if (query.isError || !coach) {
    return (
      <AppShell>
        <ErrorState
          message={
            query.error instanceof Error
              ? query.error.message
              : 'No fue posible cargar el entrenador.'
          }
        />
      </AppShell>
    )
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow="Detalle de entrenador"
        title={`${coach.name} ${coach.lastName}`}
        subtitle={coach.email}
        actions={
          canManage ? (
            <Button variant="outlined" onClick={() => navigate(`/coaches/${coach.id}/edit`)}>
              Editar
            </Button>
          ) : undefined
        }
      />
      {message && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {message}
        </Alert>
      )}
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 5 }}>
          <Panel title="Información personal">
            <Stack spacing={1.25} sx={{ mt: 2 }}>
              <Typography>{coach.email}</Typography>
              <Typography>{coach.phone}</Typography>
              <Typography>DNI: {coach.dni}</Typography>
              <StatusBadge
                label={coach.isActive ? 'Activo' : 'Inactivo'}
                status={coach.isActive ? 'success' : 'error'}
              />
            </Stack>
          </Panel>
        </Grid>
        <Grid size={{ xs: 12, md: 7 }}>
          <Stack spacing={2}>
            <Panel
              title="Horarios"
              subtitle="La API actual aún no expone operaciones de horarios."
            >
              <Stack spacing={1.5} sx={{ mt: 2 }}>
                <Typography color="text.secondary">
                  La gestión de horarios estará disponible cuando exista el endpoint
                  correspondiente.
                </Typography>
                <Button disabled variant="outlined">
                  Agregar horario
                </Button>
              </Stack>
            </Panel>
            <Panel
              title="Rutinas y clientes asignados"
              subtitle="Relación operativa del entrenador."
            >
              <Typography color="text.secondary" sx={{ mt: 2 }}>
                Las rutinas creadas y los clientes asignados se incorporarán en la Fase 9
                (Rutinas y progreso).
              </Typography>
            </Panel>
          </Stack>
        </Grid>
      </Grid>
    </AppShell>
  )
}
