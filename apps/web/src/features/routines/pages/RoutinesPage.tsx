import {
  Button,
  MenuItem,
  Stack,
  TableCell,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import { useMemo, useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { EmptyState, ErrorState, LoadingState } from '../../../components/feedback/States'
import { SearchField } from '../../../components/forms/SearchField'
import { StatusFilter, type StatusFilterValue } from '../../../components/forms/StatusFilter'
import { AppShell } from '../../../components/layout/AppShell'
import { PageHeader } from '../../../components/layout/PageHeader'
import { DataTable } from '../../../components/ui/DataTable'
import { Icon } from '../../../components/ui/Icon'
import { StatusBadge } from '../../../components/ui/StatusBadge'
import { HttpError } from '../../../lib/http'
import { formatDate } from '../../../utils/format'
import { canManageRoutines, useAuth } from '../../auth'
import { useAssignments, useRoutines } from '../hooks'
import {
  assignmentStatusLabels,
  assignmentStatusTone,
  routineLevelLabels,
} from '../labels'
import { routineLevels, type RoutineLevel } from '../types'

function errorMessage(error: unknown): string {
  return error instanceof HttpError || error instanceof Error
    ? error.message
    : 'No fue posible cargar las rutinas.'
}

export function RoutinesPage() {
  const { user } = useAuth()
  const canManage = canManageRoutines(user?.role)
  const isClient = user?.role === 'CLIENT'
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<StatusFilterValue>('all')
  const [level, setLevel] = useState<RoutineLevel | 'all'>('all')
  const routinesQuery = useRoutines(
    { includeInactive: user?.role === 'ADMIN' },
    !isClient,
  )
  const assignmentsQuery = useAssignments({}, isClient)

  const routines = useMemo(() => {
    const normalized = search.trim().toLowerCase()

    return (routinesQuery.data ?? []).filter((routine) => {
      const matchesSearch =
        !normalized ||
        `${routine.name} ${routine.description ?? ''}`.toLowerCase().includes(normalized)
      const matchesStatus =
        status === 'all' || (status === 'active' ? routine.isActive : !routine.isActive)
      const matchesLevel = level === 'all' || routine.level === level

      return matchesSearch && matchesStatus && matchesLevel
    })
  }, [level, routinesQuery.data, search, status])

  const assignments = useMemo(() => {
    const normalized = search.trim().toLowerCase()

    return (assignmentsQuery.data ?? []).filter((assignment) => {
      if (!normalized) {
        return true
      }

      return `${assignment.routine?.name ?? ''} ${assignment.notes ?? ''}`
        .toLowerCase()
        .includes(normalized)
    })
  }, [assignmentsQuery.data, search])

  if (isClient) {
    return (
      <AppShell>
        <PageHeader
          eyebrow="Mi entrenamiento"
          title="Mis rutinas"
          subtitle="Consulta las rutinas asignadas, sus días y ejercicios."
        />
        <Stack spacing={2}>
          <SearchField
            value={search}
            onChange={setSearch}
            placeholder="Buscar por nombre de rutina"
            label="Buscar mis rutinas"
          />
          {assignmentsQuery.isLoading && <LoadingState label="Cargando rutinas..." />}
          {assignmentsQuery.isError && (
            <ErrorState message={errorMessage(assignmentsQuery.error)} />
          )}
          {assignmentsQuery.isSuccess && assignments.length === 0 && (
            <EmptyState
              message={
                search
                  ? 'No hay rutinas que coincidan con la búsqueda.'
                  : 'Todavía no tienes rutinas asignadas.'
              }
            />
          )}
          {assignmentsQuery.isSuccess && assignments.length > 0 && (
            <DataTable headers={['RUTINA', 'INICIO', 'FIN', 'ESTADO', 'ACCIONES']} minWidth={780}>
              {assignments.map((assignment) => (
                <TableRow key={assignment.id} hover>
                  <TableCell>
                    {assignment.routine?.name ?? `Rutina #${assignment.routineId}`}
                    {assignment.routine && (
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                        {routineLevelLabels[assignment.routine.level]}
                      </Typography>
                    )}
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
                    <Button
                      component={RouterLink}
                      to={`/routines/${assignment.routineId}`}
                      size="small"
                    >
                      Ver rutina
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </DataTable>
          )}
        </Stack>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow="Programación"
        title="Rutinas"
        subtitle="Crea rutinas, organiza ejercicios y asigna planes a tus clientes."
        actions={
          canManage ? (
            <Stack sx={{ flexDirection: 'row', gap: 1, flexWrap: 'wrap' }}>
              <Button component={RouterLink} to="/routines/exercises" variant="outlined">
                Ejercicios
              </Button>
              <Button component={RouterLink} to="/routines/assignments" variant="outlined">
                Asignaciones
              </Button>
              <Button
                component={RouterLink}
                to="/routines/new"
                variant="contained"
                startIcon={<Icon name="add" size={18} />}
              >
                Nueva rutina
              </Button>
            </Stack>
          ) : undefined
        }
      />
      <Stack spacing={2}>
        <Stack sx={{ flexDirection: { xs: 'column', sm: 'row' }, gap: 1.5 }}>
          <SearchField
            value={search}
            onChange={setSearch}
            placeholder="Buscar por nombre o descripción"
            label="Buscar rutinas"
          />
          <TextField
            select
            size="small"
            label="Nivel"
            value={level}
            onChange={(event) => setLevel(event.target.value as RoutineLevel | 'all')}
            sx={{ minWidth: { sm: 180 } }}
          >
            <MenuItem value="all">Todos</MenuItem>
            {routineLevels.map((routineLevel) => (
              <MenuItem key={routineLevel} value={routineLevel}>
                {routineLevelLabels[routineLevel]}
              </MenuItem>
            ))}
          </TextField>
          {user?.role === 'ADMIN' && (
            <StatusFilter value={status} onChange={setStatus} />
          )}
        </Stack>
        {routinesQuery.isLoading && <LoadingState label="Cargando rutinas..." />}
        {routinesQuery.isError && <ErrorState message={errorMessage(routinesQuery.error)} />}
        {routinesQuery.isSuccess && (
          <Typography variant="caption" color="text.secondary">
            {routines.length} de {routinesQuery.data.length} rutinas
          </Typography>
        )}
        {routinesQuery.isSuccess && routines.length === 0 && (
          <EmptyState
            message={
              search || status !== 'all' || level !== 'all'
                ? 'No hay rutinas que coincidan con los filtros.'
                : 'No hay rutinas registradas.'
            }
          />
        )}
        {routinesQuery.isSuccess && routines.length > 0 && (
          <DataTable headers={['RUTINA', 'NIVEL', 'ENTRENADOR', 'EJERCICIOS', 'ESTADO', 'ACCIONES']} minWidth={900}>
            {routines.map((routine) => (
              <TableRow key={routine.id} hover>
                <TableCell>
                  {routine.name}
                  {routine.description && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      {routine.description}
                    </Typography>
                  )}
                </TableCell>
                <TableCell>{routineLevelLabels[routine.level]}</TableCell>
                <TableCell>
                  {routine.creator
                    ? `${routine.creator.name} ${routine.creator.lastName}`
                    : `Entrenador #${routine.createdById}`}
                </TableCell>
                <TableCell>{routine.exercises?.length ?? 0}</TableCell>
                <TableCell>
                  <StatusBadge
                    label={routine.isActive ? 'Activa' : 'Inactiva'}
                    status={routine.isActive ? 'success' : 'error'}
                  />
                </TableCell>
                <TableCell>
                  <Stack sx={{ flexDirection: 'row', gap: 0.5, flexWrap: 'wrap' }}>
                    <Button
                      component={RouterLink}
                      to={`/routines/${routine.id}`}
                      size="small"
                    >
                      Ver
                    </Button>
                    {canManage && routine.isActive && (
                      <Button
                        component={RouterLink}
                        to={`/routines/${routine.id}/edit`}
                        size="small"
                      >
                        Editar
                      </Button>
                    )}
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </DataTable>
        )}
      </Stack>
    </AppShell>
  )
}
