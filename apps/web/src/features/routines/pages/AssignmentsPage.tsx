import {
  Alert,
  Button,
  MenuItem,
  Stack,
  TableCell,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { EmptyState, ErrorState, LoadingState } from '../../../components/feedback/States'
import { AppShell } from '../../../components/layout/AppShell'
import { PageHeader } from '../../../components/layout/PageHeader'
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog'
import { DataTable } from '../../../components/ui/DataTable'
import { Icon } from '../../../components/ui/Icon'
import { StatusBadge } from '../../../components/ui/StatusBadge'
import { HttpError } from '../../../lib/http'
import { formatDate } from '../../../utils/format'
import { useClients } from '../../clients/hooks'
import { RoutineAssignmentForm } from '../components/RoutineAssignmentForm'
import { useAssignments, useUpdateAssignmentStatus } from '../hooks'
import { assignmentStatusLabels, assignmentStatusTone } from '../labels'
import {
  assignmentStatuses,
  type AssignmentStatus,
  type ClientRoutine,
} from '../types'

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof HttpError || error instanceof Error ? error.message : fallback
}

interface PendingStatusChange {
  assignment: ClientRoutine
  status: Extract<AssignmentStatus, 'COMPLETED' | 'CANCELLED'>
}

export function AssignmentsPage() {
  const [searchParams] = useSearchParams()
  const initialRoutineId = Number(searchParams.get('routineId'))
  const clientsQuery = useClients()
  const [clientId, setClientId] = useState<string>('all')
  const [status, setStatus] = useState<AssignmentStatus | 'all'>('all')
  const assignmentsQuery = useAssignments({
    clientId: clientId === 'all' ? undefined : Number(clientId),
    status: status === 'all' ? undefined : status,
  })
  const statusMutation = useUpdateAssignmentStatus()
  const [message, setMessage] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(Number.isInteger(initialRoutineId) && initialRoutineId > 0)
  const [pendingChange, setPendingChange] = useState<PendingStatusChange | null>(null)

  const clientNames = useMemo(
    () =>
      new Map(
        (clientsQuery.data ?? []).map((client) => [
          client.id,
          `${client.name} ${client.lastName}`,
        ]),
      ),
    [clientsQuery.data],
  )

  const changeStatus = async () => {
    if (!pendingChange) {
      return
    }

    setActionError(null)

    try {
      await statusMutation.mutateAsync({
        id: pendingChange.assignment.id,
        status: pendingChange.status,
      })
      setMessage(
        pendingChange.status === 'COMPLETED'
          ? 'Asignación completada correctamente.'
          : 'Asignación cancelada correctamente.',
      )
      setPendingChange(null)
    } catch (error: unknown) {
      setActionError(errorMessage(error, 'No fue posible actualizar la asignación.'))
      setPendingChange(null)
    }
  }

  const assignments = assignmentsQuery.data ?? []

  return (
    <AppShell>
      <PageHeader
        eyebrow="Rutinas"
        title="Asignaciones"
        subtitle="Vincula rutinas a clientes y controla la vigencia de cada plan."
        actions={
          <Button
            variant="contained"
            startIcon={<Icon name="add" size={18} />}
            onClick={() => setDialogOpen(true)}
          >
            Nueva asignación
          </Button>
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
          <TextField
            select
            size="small"
            label="Cliente"
            value={clientId}
            onChange={(event) => setClientId(event.target.value)}
            sx={{ minWidth: { sm: 240 } }}
          >
            <MenuItem value="all">Todos los clientes</MenuItem>
            {(clientsQuery.data ?? []).map((client) => (
              <MenuItem key={client.id} value={String(client.id)}>
                {client.name} {client.lastName}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            size="small"
            label="Estado"
            value={status}
            onChange={(event) => setStatus(event.target.value as AssignmentStatus | 'all')}
            sx={{ minWidth: { sm: 180 } }}
          >
            <MenuItem value="all">Todos</MenuItem>
            {assignmentStatuses.map((assignmentStatus) => (
              <MenuItem key={assignmentStatus} value={assignmentStatus}>
                {assignmentStatusLabels[assignmentStatus]}
              </MenuItem>
            ))}
          </TextField>
          <Button
            variant="text"
            onClick={() => {
              setClientId('all')
              setStatus('all')
            }}
          >
            Limpiar
          </Button>
        </Stack>

        {assignmentsQuery.isLoading && <LoadingState label="Cargando asignaciones..." />}
        {assignmentsQuery.isError && (
          <ErrorState message={errorMessage(assignmentsQuery.error, 'No fue posible cargar las asignaciones.')} />
        )}
        {assignmentsQuery.isSuccess && (
          <Typography variant="caption" color="text.secondary">
            {assignments.length} {assignments.length === 1 ? 'asignación' : 'asignaciones'}
          </Typography>
        )}
        {assignmentsQuery.isSuccess && assignments.length === 0 && (
          <EmptyState
            message={
              clientId !== 'all' || status !== 'all'
                ? 'No hay asignaciones que coincidan con los filtros.'
                : 'No hay rutinas asignadas a clientes.'
            }
          />
        )}
        {assignmentsQuery.isSuccess && assignments.length > 0 && (
          <DataTable
            headers={['CLIENTE', 'RUTINA', 'ENTRENADOR', 'INICIO', 'FIN', 'ESTADO', 'ACCIONES']}
            minWidth={980}
          >
            {assignments.map((assignment) => (
              <TableRow key={assignment.id} hover>
                <TableCell>
                  {assignment.client
                    ? `${assignment.client.name} ${assignment.client.lastName}`
                    : clientNames.get(assignment.clientId) ?? `Cliente #${assignment.clientId}`}
                </TableCell>
                <TableCell>
                  {assignment.routine?.name ?? `Rutina #${assignment.routineId}`}
                  {assignment.notes && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      {assignment.notes}
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  {assignment.assignedBy
                    ? `${assignment.assignedBy.name} ${assignment.assignedBy.lastName}`
                    : `Entrenador #${assignment.assignedById}`}
                </TableCell>
                <TableCell>{formatDate(assignment.startDate)}</TableCell>
                <TableCell>{formatDate(assignment.endDate)}</TableCell>
                <TableCell>
                  <StatusBadge
                    label={assignmentStatusLabels[assignment.status]}
                    status={assignmentStatusTone(assignment.status)}
                  />
                </TableCell>
                <TableCell>
                  {assignment.status === 'ACTIVE' ? (
                    <Stack sx={{ flexDirection: 'row', gap: 0.5, flexWrap: 'wrap' }}>
                      <Button
                        size="small"
                        onClick={() =>
                          setPendingChange({ assignment, status: 'COMPLETED' })
                        }
                      >
                        Completar
                      </Button>
                      <Button
                        size="small"
                        color="error"
                        onClick={() =>
                          setPendingChange({ assignment, status: 'CANCELLED' })
                        }
                      >
                        Cancelar
                      </Button>
                    </Stack>
                  ) : (
                    <Typography variant="caption" color="text.secondary">
                      Sin acciones
                    </Typography>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </DataTable>
        )}
      </Stack>

      <RoutineAssignmentForm
        open={dialogOpen}
        initialRoutineId={
          Number.isInteger(initialRoutineId) && initialRoutineId > 0
            ? initialRoutineId
            : undefined
        }
        onClose={() => setDialogOpen(false)}
        onCreated={() => {
          setDialogOpen(false)
          setMessage('Rutina asignada correctamente.')
        }}
      />

      <ConfirmDialog
        open={pendingChange !== null}
        title={
          pendingChange?.status === 'COMPLETED'
            ? 'Completar asignación'
            : 'Cancelar asignación'
        }
        description={
          pendingChange?.status === 'COMPLETED'
            ? 'La asignación se marcará como completada y el cliente podrá recibir una nueva rutina.'
            : 'La asignación se cancelará y el cliente podrá recibir una nueva rutina.'
        }
        confirmLabel={
          pendingChange?.status === 'COMPLETED' ? 'Completar' : 'Cancelar asignación'
        }
        loading={statusMutation.isPending}
        onConfirm={() => {
          void changeStatus()
        }}
        onClose={() => setPendingChange(null)}
      />
    </AppShell>
  )
}
