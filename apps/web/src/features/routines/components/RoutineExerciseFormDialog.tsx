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
import { useAddRoutineExercise, useUpdateRoutineExercise } from '../hooks'
import type { Exercise, RoutineExercise } from '../types'

interface RoutineExerciseFormValues {
  exerciseId: string
  dayNumber: string
  position: string
  sets: string
  reps: string
  weightKg: string
  restSeconds: string
  notes: string
}

const integerMessage = 'Ingresa un número entero válido.'
const optionalNumberMessage = 'Ingresa un número válido o déjalo vacío.'

const routineExerciseSchema = z.object({
  exerciseId: z.string().trim().min(1, 'Selecciona un ejercicio.'),
  dayNumber: z
    .string()
    .trim()
    .regex(/^\d+$/, integerMessage)
    .refine((value) => Number(value) >= 1 && Number(value) <= 14, 'Usa un día entre 1 y 14.'),
  position: z
    .string()
    .trim()
    .regex(/^\d+$/, integerMessage)
    .refine((value) => Number(value) >= 1, 'La posición debe ser mayor a cero.'),
  sets: z
    .string()
    .trim()
    .regex(/^\d+$/, integerMessage)
    .refine((value) => Number(value) > 0, 'Las series deben ser mayores a cero.'),
  reps: z
    .string()
    .trim()
    .regex(/^\d+$/, integerMessage)
    .refine((value) => Number(value) > 0, 'Las repeticiones deben ser mayores a cero.'),
  weightKg: z
    .string()
    .trim()
    .refine(
      (value) => value === '' || (/^\d+(\.\d+)?$/.test(value) && Number(value) >= 0),
      optionalNumberMessage,
    ),
  restSeconds: z
    .string()
    .trim()
    .refine(
      (value) => value === '' || (/^\d+$/.test(value) && Number(value) >= 0),
      'Usa segundos enteros no negativos o deja vacío.',
    ),
  notes: z.string().trim().max(2000, 'Máximo 2000 caracteres.'),
})

const defaultValues: RoutineExerciseFormValues = {
  exerciseId: '',
  dayNumber: '1',
  position: '1',
  sets: '3',
  reps: '10',
  weightKg: '',
  restSeconds: '',
  notes: '',
}

interface RoutineExerciseFormDialogProps {
  open: boolean
  routineId: number
  exercises: Exercise[]
  routineExercises: RoutineExercise[]
  item: RoutineExercise | null
  onClose: () => void
}

function nextPosition(items: RoutineExercise[], dayNumber: number): number {
  const positions = items
    .filter((item) => item.dayNumber === dayNumber)
    .map((item) => item.position)

  return positions.length === 0 ? 1 : Math.max(...positions) + 1
}

export function RoutineExerciseFormDialog({
  open,
  routineId,
  exercises,
  routineExercises,
  item,
  onClose,
}: RoutineExerciseFormDialogProps) {
  const addMutation = useAddRoutineExercise(routineId)
  const updateMutation = useUpdateRoutineExercise(routineId)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    reset,
    setError,
    clearErrors,
    control,
    formState: { errors },
  } = useForm<RoutineExerciseFormValues>({ defaultValues })
  const isPending = addMutation.isPending || updateMutation.isPending

  useEffect(() => {
    if (!open) {
      return
    }

    setSubmitError(null)
    reset(
      item
        ? {
            exerciseId: String(item.exerciseId),
            dayNumber: String(item.dayNumber),
            position: String(item.position),
            sets: String(item.sets),
            reps: String(item.reps),
            weightKg: item.weightKg ?? '',
            restSeconds: item.restSeconds === null ? '' : String(item.restSeconds),
            notes: item.notes ?? '',
          }
        : {
            ...defaultValues,
            exerciseId: exercises[0] ? String(exercises[0].id) : '',
            position: String(nextPosition(routineExercises, 1)),
          },
    )
  }, [exercises, item, open, reset, routineExercises])

  const onSubmit = (values: RoutineExerciseFormValues) => {
    setSubmitError(null)
    clearErrors()

    const result = routineExerciseSchema.safeParse(values)

    if (!result.success) {
      if (applyZodIssues(result.error, setError) === 0) {
        setSubmitError('Revisa los datos del ejercicio.')
      }
      return
    }

    const dayNumber = Number(result.data.dayNumber)
    const position = Number(result.data.position)
    const duplicated = routineExercises.some(
      (routineExercise) =>
        routineExercise.id !== item?.id &&
        routineExercise.dayNumber === dayNumber &&
        routineExercise.position === position,
    )

    if (duplicated) {
      setError('position', {
        type: 'validation',
        message: 'Ya existe un ejercicio en ese día y posición.',
      })
      setSubmitError('Revisa los campos marcados.')
      return
    }

    const input = {
      exerciseId: Number(result.data.exerciseId),
      dayNumber,
      position,
      sets: Number(result.data.sets),
      reps: Number(result.data.reps),
      weightKg: result.data.weightKg === '' ? null : Number(result.data.weightKg),
      restSeconds: result.data.restSeconds === '' ? null : Number(result.data.restSeconds),
      notes: result.data.notes || null,
    }

    const save = async () => {
      try {
        if (item) {
          await updateMutation.mutateAsync({
            routineExerciseId: item.id,
            input,
          })
        } else {
          await addMutation.mutateAsync(input)
        }
        onClose()
      } catch (error: unknown) {
        if (error instanceof HttpError) {
          if (applyHttpIssues(error, setError)) {
            setSubmitError('Revisa los campos marcados.')
            return
          }

          setSubmitError(error.message)
          return
        }

        setSubmitError('No fue posible guardar el ejercicio de la rutina.')
      }
    }

    void save()
  }

  return (
    <Dialog open={open} onClose={isPending ? undefined : onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {item ? 'Editar ejercicio de la rutina' : 'Añadir ejercicio a la rutina'}
      </DialogTitle>
      <Stack component="form" noValidate onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          <Stack spacing={2}>
            {submitError && <Alert severity="error">{submitError}</Alert>}
            {exercises.length === 0 && (
              <Alert severity="warning">
                No hay ejercicios en el catálogo. Crea uno antes de configurar la rutina.
              </Alert>
            )}
            <Controller
              control={control}
              name="exerciseId"
              render={({ field }) => (
                <TextField
                  select
                  label="Ejercicio"
                  fullWidth
                  {...field}
                  error={Boolean(errors.exerciseId)}
                  helperText={errors.exerciseId?.message}
                >
                  {exercises.map((exercise) => (
                    <MenuItem key={exercise.id} value={String(exercise.id)}>
                      {exercise.name}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
            <Grid container spacing={2}>
              <Grid size={{ xs: 6, sm: 3 }}>
                <TextField
                  label="Día"
                  type="number"
                  fullWidth
                  {...register('dayNumber')}
                  error={Boolean(errors.dayNumber)}
                  helperText={errors.dayNumber?.message}
                />
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <TextField
                  label="Posición"
                  type="number"
                  fullWidth
                  {...register('position')}
                  error={Boolean(errors.position)}
                  helperText={errors.position?.message}
                />
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <TextField
                  label="Series"
                  type="number"
                  fullWidth
                  {...register('sets')}
                  error={Boolean(errors.sets)}
                  helperText={errors.sets?.message}
                />
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <TextField
                  label="Repeticiones"
                  type="number"
                  fullWidth
                  {...register('reps')}
                  error={Boolean(errors.reps)}
                  helperText={errors.reps?.message}
                />
              </Grid>
              <Grid size={{ xs: 6, sm: 4 }}>
                <TextField
                  label="Peso (kg)"
                  type="number"
                  fullWidth
                  {...register('weightKg')}
                  error={Boolean(errors.weightKg)}
                  helperText={errors.weightKg?.message ?? 'Opcional'}
                />
              </Grid>
              <Grid size={{ xs: 6, sm: 4 }}>
                <TextField
                  label="Descanso (seg)"
                  type="number"
                  fullWidth
                  {...register('restSeconds')}
                  error={Boolean(errors.restSeconds)}
                  helperText={errors.restSeconds?.message ?? 'Opcional'}
                />
              </Grid>
            </Grid>
            <TextField
              label="Notas"
              fullWidth
              multiline
              minRows={2}
              {...register('notes')}
              error={Boolean(errors.notes)}
              helperText={errors.notes?.message ?? 'Opcional'}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={isPending}>
            Cancelar
          </Button>
          <Button type="submit" variant="contained" disabled={isPending || exercises.length === 0}>
            {isPending ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogActions>
      </Stack>
    </Dialog>
  )
}
