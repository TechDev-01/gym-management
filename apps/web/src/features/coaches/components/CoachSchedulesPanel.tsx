import {
  Alert,
  Button,
  Stack,
  TableCell,
  TableRow,
  Typography,
} from '@mui/material'
import { useState } from 'react'
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from '../../../components/feedback/States'
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog'
import { DataTable } from '../../../components/ui/DataTable'
import { Panel } from '../../../components/ui/Panel'
import { HttpError } from '../../../lib/http'
import { useCoachSchedules, useDeleteCoachSchedule } from '../hooks'
import { weekDayLabel } from '../labels'
import type { CoachSchedule } from '../types'
import { CoachScheduleFormDialog } from './CoachScheduleFormDialog'

interface Feedback {
  severity: 'success' | 'error'
  message: string
}

function errorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : 'No fue posible cargar los horarios.'
}

export function CoachSchedulesPanel({
  coachId,
  canManage,
}: {
  coachId: number
  canManage: boolean
}) {
  const schedulesQuery = useCoachSchedules(coachId)
  const deleteMutation = useDeleteCoachSchedule(coachId)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState<CoachSchedule | null>(null)
  const [scheduleToDelete, setScheduleToDelete] = useState<CoachSchedule | null>(null)
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const schedules = schedulesQuery.data ?? []

  const openCreate = () => {
    setEditingSchedule(null)
    setDialogOpen(true)
  }

  const openEdit = (schedule: CoachSchedule) => {
    setEditingSchedule(schedule)
    setDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!scheduleToDelete) {
      return
    }

    setFeedback(null)

    try {
      await deleteMutation.mutateAsync(scheduleToDelete.id)
      setFeedback({
        severity: 'success',
        message: 'Horario eliminado correctamente.',
      })
      setScheduleToDelete(null)
    } catch (error: unknown) {
      setFeedback({
        severity: 'error',
        message:
          error instanceof HttpError
            ? error.message
            : 'No fue posible eliminar el horario.',
      })
      setScheduleToDelete(null)
    }
  }

  return (
    <Panel
      title="Horarios"
      subtitle="Disponibilidad semanal recurrente del entrenador."
      action={
        canManage ? (
          <Button variant="outlined" onClick={openCreate}>
            Agregar horario
          </Button>
        ) : undefined
      }
    >
      <Stack spacing={2} sx={{ mt: 2 }}>
        {feedback && (
          <Alert
            severity={feedback.severity}
            onClose={() => setFeedback(null)}
          >
            {feedback.message}
          </Alert>
        )}
        {schedulesQuery.isLoading && (
          <LoadingState label="Cargando horarios..." />
        )}
        {schedulesQuery.isError && (
          <ErrorState message={errorMessage(schedulesQuery.error)} />
        )}
        {schedulesQuery.isSuccess && schedules.length === 0 && (
          <EmptyState message="El entrenador no tiene horarios registrados." />
        )}
        {schedulesQuery.isSuccess && schedules.length > 0 && (
          <DataTable
            headers={['DÍA', 'INICIO', 'FIN', 'ACCIONES']}
            minWidth={520}
          >
            {schedules.map((schedule) => (
              <TableRow key={schedule.id} hover>
                <TableCell>{weekDayLabel(schedule.dayOfWeek)}</TableCell>
                <TableCell>{schedule.startTime}</TableCell>
                <TableCell>{schedule.endTime}</TableCell>
                <TableCell>
                  {canManage ? (
                    <Stack sx={{ flexDirection: 'row', gap: 1 }}>
                      <Button
                        size="small"
                        onClick={() => openEdit(schedule)}
                        aria-label={`Editar horario del ${weekDayLabel(schedule.dayOfWeek)}`}
                      >
                        Editar
                      </Button>
                      <Button
                        size="small"
                        color="error"
                        onClick={() => setScheduleToDelete(schedule)}
                        aria-label={`Eliminar horario del ${weekDayLabel(schedule.dayOfWeek)}`}
                      >
                        Eliminar
                      </Button>
                    </Stack>
                  ) : (
                    <Typography variant="caption" color="text.secondary">
                      Solo lectura
                    </Typography>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </DataTable>
        )}
      </Stack>
      <CoachScheduleFormDialog
        open={dialogOpen}
        coachId={coachId}
        schedule={editingSchedule}
        onClose={() => setDialogOpen(false)}
        onSaved={(message) => setFeedback({ severity: 'success', message })}
      />
      <ConfirmDialog
        open={scheduleToDelete !== null}
        title="Eliminar horario"
        description={
          scheduleToDelete
            ? `Se eliminará el horario del ${weekDayLabel(scheduleToDelete.dayOfWeek)} de ${scheduleToDelete.startTime} a ${scheduleToDelete.endTime}.`
            : ''
        }
        confirmLabel="Eliminar horario"
        loading={deleteMutation.isPending}
        onConfirm={() => void confirmDelete()}
        onClose={() => setScheduleToDelete(null)}
      />
    </Panel>
  )
}
