import { Alert, Button, Grid, Stack, Typography } from '@mui/material'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { ErrorState, LoadingState } from '../../../components/feedback/States'
import { AppShell } from '../../../components/layout/AppShell'
import { PageHeader } from '../../../components/layout/PageHeader'
import { Panel } from '../../../components/ui/Panel'
import { StatusBadge } from '../../../components/ui/StatusBadge'
import { formatDate } from '../../../utils/format'
import {
  canManageClients,
  canViewClientAttendance,
  canViewClientMembership,
  canViewClientProgress,
  useAuth,
} from '../../auth'
import { ClientOperationalSummary } from '../components/ClientOperationalSummary'
import { useClient } from '../hooks'

export function ClientDetailPage() {
  const { user } = useAuth()
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const clientId = Number(id)
  const query = useClient(clientId)
  const client = query.data
  const message = (location.state as { message?: string } | null)?.message
  const canManage = canManageClients(user?.role)
  const canViewMembership = canViewClientMembership(user?.role)
  const canViewAttendance = canViewClientAttendance(user?.role)
  const canViewProgress = canViewClientProgress(user?.role)

  if (query.isLoading) {
    return (
      <AppShell>
        <LoadingState label="Cargando cliente..." />
      </AppShell>
    )
  }

  if (query.isError || !client) {
    return (
      <AppShell>
        <ErrorState
          message={
            query.error instanceof Error
              ? query.error.message
              : 'No fue posible cargar el cliente.'
          }
        />
      </AppShell>
    )
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow="Detalle de cliente"
        title={`${client.name} ${client.lastName}`}
        subtitle={client.email}
        actions={
          canManage ? (
            <Button variant="outlined" onClick={() => navigate(`/clients/${client.id}/edit`)}>
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
      {!canViewMembership && !canViewAttendance && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Como entrenador puedes consultar el progreso del cliente. La membresía y la
          asistencia están disponibles para administración y recepción.
        </Alert>
      )}
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 5 }}>
          <Panel title="Información personal">
            <Stack spacing={1.25} sx={{ mt: 2 }}>
              <Typography>{client.email}</Typography>
              <Typography>{client.phone}</Typography>
              <Typography>DNI: {client.dni}</Typography>
              <Typography variant="body2" color="text.secondary">
                Alta: {formatDate(client.createdAt)}
              </Typography>
              <StatusBadge
                label={client.isActive ? 'Activo' : 'Inactivo'}
                status={client.isActive ? 'success' : 'error'}
              />
            </Stack>
          </Panel>
        </Grid>
        <Grid size={{ xs: 12, md: 7 }}>
          <ClientOperationalSummary
            clientId={client.id}
            canViewMembership={canViewMembership}
            canViewAttendance={canViewAttendance}
            canViewProgress={canViewProgress}
          />
        </Grid>
      </Grid>
    </AppShell>
  )
}
