import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  MenuItem,
  Stack,
  TextField,
} from '@mui/material'
import { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'
import { applyHttpIssues, applyZodIssues } from '../../../lib/forms/validation'
import { HttpError } from '../../../lib/http'
import { useAuth } from '../../auth'
import { useClients } from '../../clients/hooks'
import { useCoaches } from '../../coaches/hooks'
import { useCreateAssignment, useRoutines } from '../hooks'
import type { ClientRoutine } from '../types'

interface AssignmentFormValues {
  clientId: string
  routineId: string
  assignedById: string
  startDate: string
  endDate: string
  notes: string
}

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Usa una fecha válida.')

const assignmentSchema = z.object({
  clientId: z.string().trim().min(1, 'Selecciona un cliente.'),
  routineId: z.string().trim().min(1, 'Selecciona una rutina.'),
  assignedById: z.string(),
  startDate: dateSchema,
  endDate: z.string().refine((value) => value === '' || /^\d{4}-\d{2}-\d{2}$/.test(value), {
    message: 'Usa una fecha válida o deja vacío.',
  }),
  notes: z.string().trim().max(2000, 'Máximo 2000 caracteres.'),
})

function todayDateString(): string {
  return new Date().toISOString().slice(0, 10)
}

interface RoutineAssignmentFormProps {
  open: boolean
  initialRoutineId?: number
  onClose: () => void
  onCreated: (assignment: ClientRoutine) => void
}

export function RoutineAssignmentForm({
  open,
  initialRoutineId,
  onClose,
  onCreated,
}: RoutineAssignmentFormProps) {
  const { user } = useAuth()
  const clientsQuery = useClients(open)
  const routinesQuery = useRoutines({}, open)
  const coachesQuery = useCoaches(open && user?.role === 'ADMIN')
  const createMutation = useCreateAssignment()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    reset,
    setError,
    clearErrors,
    control,
    formState: { errors },
  } = useForm<AssignmentFormValues>({
    defaultValues: {
      clientId: '',
      routineId: '',
      assignedById: '',
      startDate: todayDateString(),
      endDate: '',
      notes: '',
    },
  })

  useEffect(() => {
    if (!open) {
      return
    }

    setSubmitError(null)
    reset({
      clientId: '',
      routineId: initialRoutineId ? String(initialRoutineId) : '',
      assignedById: '',
      startDate: todayDateString(),
      endDate: '',
      notes: '',
    })
  }, [initialRoutineId, open, reset])

  const onSubmit = (values: AssignmentFormValues) => {
    setSubmitError(null)
    clearErrors()

    const result = assignmentSchema.safeParse(values)

    if (!result.success) {
      if (applyZodIssues(result.error, setError) === 0) {
        setSubmitError('Revisa los datos de la asignación.')
      }
      return
    }

    if (result.data.endDate && result.data.endDate < result.data.startDate) {
      setError('endDate', {
        type: 'validation',
        message: 'La fecha final no puede ser anterior a la inicial.',
      })
      setSubmitError('Revisa los datos de la asignación.')
      return
    }

    const isAdmin = user?.role === 'ADMIN'
    const assignedById = Number(result.data.assignedById)

    if (isAdmin && (!Number.isInteger(assignedById) || assignedById <= 0)) {
      setError('assignedById', {
        type: 'validation',
        message: 'Selecciona el entrenador que asigna la rutina.',
      })
      setSubmitError('Revisa los datos de la asignación.')
      return
    }

    const save = async () => {
      try {
        const assignment = await createMutation.mutateAsync({
          clientId: Number(result.data.clientId),
          routineId: Number(result.data.routineId),
          ...(isAdmin ? { assignedById } : {}),
          startDate: result.data.startDate,
          endDate: result.data.endDate || null,
          notes: result.data.notes || null,
        })

        onCreated(assignment)
      } catch (error: unknown) {
        if (error instanceof HttpError) {
          if (applyHttpIssues(error, setError)) {
            setSubmitError('Revisa los campos marcados.')
            return
          }

          if (error.status === 409) {
            setSubmitError(
              'El cliente ya tiene una rutina activa. Completa o cancela la asignación anterior antes de crear otra.',
            )
            return
          }

          setSubmitError(error.message)
          return
        }

        setSubmitError('No fue posible asignar la rutina.')
      }
    }

    void save()
  }

  const activeClients = (clientsQuery.data ?? []).filter((client) => client.isActive)
  const activeRoutines = (routinesQuery.data ?? []).filter((routine) => routine.isActive)

  return (
    <Dialog open={open} onClose={createMutation.isPending ? undefined : onClose} maxWidth="md" fullWidth>
      <DialogTitle>Asignar rutina</DialogTitle>
      <Stack component="form" noValidate onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          <Stack spacing={2}>
            {submitError && <Alert severity="error">{submitError}</Alert>}
            {clientsQuery.isError && (
              <Alert severity="error">No fue posible cargar los clientes.</Alert>
            )}
            {routinesQuery.isError && (
              <Alert severity="error">No fue posible cargar las rutinas.</Alert>
            )}
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  control={control}
                  name="clientId"
                  render={({ field }) => (
                    <TextField
                      select
                      label="Cliente"
                      fullWidth
                      {...field}
                      error={Boolean(errors.clientId)}
                      helperText={errors.clientId?.message}
                    >
                      {activeClients.map((client) => (
                        <MenuItem key={client.id} value={String(client.id)}>
                          {client.name} {client.lastName}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  control={control}
                  name="routineId"
                  render={({ field }) => (
                    <TextField
                      select
                      label="Rutina"
                      fullWidth
                      {...field}
                      error={Boolean(errors.routineId)}
                      helperText={errors.routineId?.message}
                    >
                      {activeRoutines.map((routine) => (
                        <MenuItem key={routine.id} value={String(routine.id)}>
                          {routine.name}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />
              </Grid>
              {user?.role === 'ADMIN' && (
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Controller
                    control={control}
                    name="assignedById"
                    render={({ field }) => (
                      <TextField
                        select
                        label="Entrenador"
                        fullWidth
                        {...field}
                        error={Boolean(errors.assignedById)}
                        helperText={errors.assignedById?.message}
                      >
                        {(coachesQuery.data ?? [])
                          .filter((coach) => coach.isActive)
                          .map((coach) => (
                            <MenuItem key={coach.id} value={String(coach.id)}>
                              {coach.name} {coach.lastName}
                            </MenuItem>
                          ))}
                      </TextField>
                    )}
                  />
                </Grid>
              )}
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Fecha de inicio"
                  type="date"
                  fullWidth
                  {...register('startDate')}
                  error={Boolean(errors.startDate)}
                  helperText={errors.startDate?.message}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Fecha final"
                  type="date"
                  fullWidth
                  {...register('endDate')}
                  error={Boolean(errors.endDate)}
                  helperText={errors.endDate?.message ?? 'Opcional'}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Notas"
                  fullWidth
                  multiline
                  minRows={2}
                  {...register('notes')}
                  error={Boolean(errors.notes)}
                  helperText={errors.notes?.message ?? 'Opcional'}
                />
              </Grid>
            </Grid>
            {activeClients.length === 0 && (
              <Alert severity="info">No hay clientes activos disponibles.</Alert>
            )}
            {activeRoutines.length === 0 && (
              <Alert severity="info">No hay rutinas activas disponibles.</Alert>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={createMutation.isPending}>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={
              createMutation.isPending ||
              activeClients.length === 0 ||
              activeRoutines.length === 0
            }
          >
            {createMutation.isPending ? 'Asignando...' : 'Asignar'}
          </Button>
        </DialogActions>
      </Stack>
    </Dialog>
  )
}
