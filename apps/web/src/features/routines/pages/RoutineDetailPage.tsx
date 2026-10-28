import { Alert, Box, Button, Grid, Stack, Typography } from '@mui/material'
import { useMemo, useState } from 'react'
import { Link as RouterLink, useLocation, useNavigate, useParams } from 'react-router-dom'
import { EmptyState, ErrorState, LoadingState } from '../../../components/feedback/States'
import { AppShell } from '../../../components/layout/AppShell'
import { PageHeader } from '../../../components/layout/PageHeader'
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog'
import { Panel } from '../../../components/ui/Panel'
import { StatusBadge } from '../../../components/ui/StatusBadge'
import { HttpError } from '../../../lib/http'
import { formatDate } from '../../../utils/format'
import { canManageRoutines, useAuth } from '../../auth'
import { RoutineDayPanel } from '../components/RoutineDayPanel'
import { RoutineExerciseFormDialog } from '../components/RoutineExerciseFormDialog'
import {
  useDeleteRoutineExercise,
  useExercises,
  useRoutine,
  useSetRoutineStatus,
} from '../hooks'
import { routineLevelLabels } from '../labels'
import type { RoutineExercise } from '../types'

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof HttpError || error instanceof Error ? error.message : fallback
}

export function RoutineDetailPage() {
  const { id = '' } = useParams()
  const routineId = Number(id)
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const routineQuery = useRoutine(routineId)
  const exercisesQuery = useExercises(canManageRoutines(user?.role))
  const statusMutation = useSetRoutineStatus()
  const deleteMutation = useDeleteRoutineExercise(routineId)
  const [message, setMessage] = useState<string | null>(
    (location.state as { message?: string } | null)?.message ?? null,
  )
  const [actionError, setActionError] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<RoutineExercise | null>(null)
  const [pendingDelete, setPendingDelete] = useState<RoutineExercise | null>(null)
  const [statusConfirmOpen, setStatusConfirmOpen] = useState(false)

  const routine = routineQuery.data
  const canManage = canManageRoutines(user?.role)
  const canEdit =
    canManage &&
    routine !== undefined &&
    (user?.role === 'ADMIN' || user?.coachId === routine.createdById)
  const exerciseItems = useMemo(
    () =>
      [...(routine?.exercises ?? [])].sort(
        (left, right) =>
          left.dayNumber - right.dayNumber || left.position - right.position,
      ),
    [routine?.exercises],
  )
  const days = useMemo(() => {
    const grouped = new Map<number, RoutineExercise[]>()

    for (const item of exerciseItems) {
      const items = grouped.get(item.dayNumber) ?? []
      items.push(item)
      grouped.set(item.dayNumber, items)
    }

    return [...grouped.entries()].sort(([left], [right]) => left - right)
  }, [exerciseItems])

  const changeStatus = async () => {
    if (!routine) {
      return
    }

    setActionError(null)

    try {
      await statusMutation.mutateAsync({
        id: routine.id,
        isActive: !routine.isActive,
      })
      setStatusConfirmOpen(false)
    } catch (error: unknown) {
      setActionError(errorMessage(error, 'No fue posible cambiar el estado de la rutina.'))
      setStatusConfirmOpen(false)
    }
  }

  const deleteExercise = async () => {
    if (!pendingDelete) {
      return
    }

    setActionError(null)

    try {
      await deleteMutation.mutateAsync(pendingDelete.id)
      setPendingDelete(null)
    } catch (error: unknown) {
      setActionError(errorMessage(error, 'No fue posible eliminar el ejercicio.'))
      setPendingDelete(null)
    }
  }

  if (routineQuery.isLoading) {
    return (
      <AppShell>
        <LoadingState label="Cargando rutina..." />
      </AppShell>
    )
  }

  if (!Number.isInteger(routineId) || routineId <= 0) {
    return (
      <AppShell>
        <ErrorState message="La rutina solicitada no es válida." />
      </AppShell>
    )
  }

  if (routineQuery.isError || !routine) {
    return (
      <AppShell>
        <ErrorState message={errorMessage(routineQuery.error, 'No fue posible cargar la rutina.')} />
      </AppShell>
    )
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow="Rutina"
        title={routine.name}
        subtitle={routine.description ?? 'Sin descripción.'}
        actions={
          canEdit ? (
            <Stack sx={{ flexDirection: 'row', gap: 1, flexWrap: 'wrap' }}>
              <Button
                component={RouterLink}
                to={`/routines/assignments?routineId=${routine.id}`}
                variant="outlined"
              >
                Asignar a cliente
              </Button>
              {routine.isActive && (
                <Button variant="outlined" onClick={() => navigate(`/routines/${routine.id}/edit`)}>
                  Editar
                </Button>
              )}
              <Button
                variant={routine.isActive ? 'outlined' : 'contained'}
                color={routine.isActive ? 'error' : 'primary'}
                onClick={() => setStatusConfirmOpen(true)}
              >
                {routine.isActive ? 'Desactivar' : 'Activar'}
              </Button>
            </Stack>
          ) : undefined
        }
      />
      <Stack spacing={2}>
        {message && (
          <Alert severity="success" onClose={() => setMessage(null)}>
            {message}
          </Alert>
        )}
        {actionError && <ErrorState message={actionError} />}
        {!routine.isActive && (
          <Alert severity="warning">
            Esta rutina está inactiva. Solo administración puede consultarla y debe
            reactivarse para modificarla o asignarla.
          </Alert>
        )}
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 8 }}>
            <Panel title="Detalle" subtitle="Información general de la rutina">
              <Grid container spacing={2} sx={{ mt: 0.5 }}>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <Typography variant="caption" color="text.secondary">
                    Nivel
                  </Typography>
                  <Typography variant="body2">{routineLevelLabels[routine.level]}</Typography>
                </Grid>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <Typography variant="caption" color="text.secondary">
                    Días
                  </Typography>
                  <Typography variant="body2">{days.length}</Typography>
                </Grid>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <Typography variant="caption" color="text.secondary">
                    Ejercicios
                  </Typography>
                  <Typography variant="body2">{exerciseItems.length}</Typography>
                </Grid>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <Typography variant="caption" color="text.secondary">
                    Creada
                  </Typography>
                  <Typography variant="body2">{formatDate(routine.createdAt)}</Typography>
                </Grid>
              </Grid>
            </Panel>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Panel title="Estado" subtitle="Disponibilidad de la rutina">
              <Stack spacing={1.5} sx={{ mt: 2 }}>
                <StatusBadge
                  label={routine.isActive ? 'Activa' : 'Inactiva'}
                  status={routine.isActive ? 'success' : 'error'}
                />
                <Typography variant="body2" color="text.secondary">
                  Entrenador:{' '}
                  {routine.creator
                    ? `${routine.creator.name} ${routine.creator.lastName}`
                    : `#${routine.createdById}`}
                </Typography>
              </Stack>
            </Panel>
          </Grid>
        </Grid>

        <Box>
          <Stack
            sx={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              mb: 1.5,
            }}
          >
            <Typography variant="h6">Ejercicios</Typography>
            {canEdit && routine.isActive && (
              <Button
                variant="contained"
                size="small"
                onClick={() => {
                  setEditingItem(null)
                  setDialogOpen(true)
                }}
              >
                Añadir ejercicio
              </Button>
            )}
          </Stack>
          {days.length === 0 ? (
            <EmptyState message="La rutina todavía no tiene ejercicios configurados." />
          ) : (
            <Stack spacing={2}>
              {days.map(([dayNumber, items]) => (
                <RoutineDayPanel
                  key={dayNumber}
                  dayNumber={dayNumber}
                  exercises={items}
                  canManage={canEdit && routine.isActive}
                  onEdit={(item) => {
                    setEditingItem(item)
                    setDialogOpen(true)
                  }}
                  onDelete={setPendingDelete}
                />
              ))}
            </Stack>
          )}
        </Box>
      </Stack>

      {canEdit && (
        <RoutineExerciseFormDialog
          open={dialogOpen}
          routineId={routine.id}
          exercises={exercisesQuery.data ?? []}
          routineExercises={routine.exercises ?? []}
          item={editingItem}
          onClose={() => {
            setDialogOpen(false)
            setEditingItem(null)
          }}
        />
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Eliminar ejercicio"
        description={`Se eliminará "${pendingDelete?.exercise?.name ?? 'el ejercicio'}" de esta rutina.`}
        confirmLabel="Eliminar"
        loading={deleteMutation.isPending}
        onConfirm={() => {
          void deleteExercise()
        }}
        onClose={() => setPendingDelete(null)}
      />

      <ConfirmDialog
        open={statusConfirmOpen}
        title={routine.isActive ? 'Desactivar rutina' : 'Activar rutina'}
        description={
          routine.isActive
            ? `La rutina "${routine.name}" dejará de estar disponible para nuevas asignaciones.`
            : `La rutina "${routine.name}" volverá a estar disponible para asignaciones.`
        }
        confirmLabel={routine.isActive ? 'Desactivar' : 'Activar'}
        loading={statusMutation.isPending}
        onConfirm={() => {
          void changeStatus()
        }}
        onClose={() => setStatusConfirmOpen(false)}
      />
    </AppShell>
  )
}
