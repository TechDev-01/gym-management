import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
} from '@mui/material'
import { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'
import { HttpError } from '../../../lib/http'
import { applyHttpIssues, applyZodIssues } from '../../../lib/forms/validation'
import { useCreateCoachSchedule, useUpdateCoachSchedule } from '../hooks'
import { weekDays } from '../labels'
import type { CoachSchedule, CoachScheduleInput } from '../types'

const timeSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Usa el formato HH:mm.')

const scheduleSchema = z
  .object({
    dayOfWeek: z.number().int().min(1).max(7),
    startTime: timeSchema,
    endTime: timeSchema,
  })
  .refine((values) => values.startTime < values.endTime, {
    message: 'La hora de fin debe ser posterior a la de inicio.',
    path: ['endTime'],
  })

const defaultValues: CoachScheduleInput = {
  dayOfWeek: 1,
  startTime: '08:00',
  endTime: '16:00',
}

interface CoachScheduleFormDialogProps {
  open: boolean
  coachId: number
  schedule: CoachSchedule | null
  onClose: () => void
  onSaved: (message: string) => void
}

export function CoachScheduleFormDialog({
  open,
  coachId,
  schedule,
  onClose,
  onSaved,
}: CoachScheduleFormDialogProps) {
  const createMutation = useCreateCoachSchedule(coachId)
  const updateMutation = useUpdateCoachSchedule(coachId)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const {
    control,
    register,
    handleSubmit,
    reset,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<CoachScheduleInput>({ defaultValues })
  const isPending = createMutation.isPending || updateMutation.isPending

  useEffect(() => {
    if (!open) {
      return
    }

    setSubmitError(null)
    reset(
      schedule
        ? {
            dayOfWeek: schedule.dayOfWeek,
            startTime: schedule.startTime.slice(0, 5),
            endTime: schedule.endTime.slice(0, 5),
          }
        : defaultValues,
    )
  }, [open, reset, schedule])

  const onSubmit = (values: CoachScheduleInput) => {
    setSubmitError(null)
    clearErrors()

    const result = scheduleSchema.safeParse(values)

    if (!result.success) {
      if (applyZodIssues(result.error, setError) === 0) {
        setSubmitError('Revisa el horario ingresado.')
      }
      return
    }

    const save = async () => {
      try {
        if (schedule) {
          await updateMutation.mutateAsync({
            scheduleId: schedule.id,
            input: result.data,
          })
          onSaved('Horario actualizado correctamente.')
        } else {
          await createMutation.mutateAsync(result.data)
          onSaved('Horario agregado correctamente.')
        }
        onClose()
      } catch (error: unknown) {
        if (error instanceof HttpError) {
          if (applyHttpIssues(error, setError)) {
            setSubmitError('Revisa los campos marcados.')
            return
          }

          if (error.status === 409) {
            setError('endTime', {
              type: 'server',
              message: 'El horario se solapa con otro existente.',
            })
            setSubmitError('Ya existe un horario que se solapa con este rango.')
            return
          }

          setSubmitError(error.message)
          return
        }

        setSubmitError('No fue posible guardar el horario.')
      }
    }

    void save()
  }

  return (
    <Dialog open={open} onClose={isPending ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{schedule ? 'Editar horario' : 'Agregar horario'}</DialogTitle>
      <Stack component="form" noValidate onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          <Stack spacing={2}>
            {submitError && <Alert severity="error">{submitError}</Alert>}
            <Controller
              control={control}
              name="dayOfWeek"
              render={({ field }) => (
                <TextField
                  select
                  label="Día"
                  fullWidth
                  {...field}
                  onChange={(event) => field.onChange(Number(event.target.value))}
                  error={Boolean(errors.dayOfWeek)}
                  helperText={errors.dayOfWeek?.message}
                >
                  {weekDays.map((day) => (
                    <MenuItem key={day.value} value={day.value}>
                      {day.label}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
            <Stack sx={{ flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
              <TextField
                label="Hora de inicio"
                type="time"
                fullWidth
                {...register('startTime')}
                error={Boolean(errors.startTime)}
                helperText={errors.startTime?.message}
              />
              <TextField
                label="Hora de fin"
                type="time"
                fullWidth
                {...register('endTime')}
                error={Boolean(errors.endTime)}
                helperText={errors.endTime?.message}
              />
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={isPending}>
            Cancelar
          </Button>
          <Button type="submit" variant="contained" disabled={isPending}>
            {isPending ? 'Guardando...' : 'Guardar horario'}
          </Button>
        </DialogActions>
      </Stack>
    </Dialog>
  )
}
