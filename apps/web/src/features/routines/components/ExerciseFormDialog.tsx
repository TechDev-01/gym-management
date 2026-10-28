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
import { applyHttpIssues, applyZodIssues } from '../../../lib/forms/validation'
import { HttpError } from '../../../lib/http'
import { useCreateExercise, useUpdateExercise } from '../hooks'
import { muscleGroupLabels } from '../labels'
import { muscleGroups, type Exercise, type MuscleGroup } from '../types'

interface ExerciseFormValues {
  name: string
  muscleGroup: MuscleGroup
  equipment: string
  description: string
}

const exerciseSchema = z.object({
  name: z.string().trim().min(1, 'El nombre es obligatorio.').max(100, 'Máximo 100 caracteres.'),
  muscleGroup: z.enum(muscleGroups),
  equipment: z.string().trim().max(100, 'Máximo 100 caracteres.'),
  description: z.string().trim().max(2000, 'Máximo 2000 caracteres.'),
})

const defaultValues: ExerciseFormValues = {
  name: '',
  muscleGroup: 'FULL_BODY',
  equipment: '',
  description: '',
}

interface ExerciseFormDialogProps {
  open: boolean
  exercise: Exercise | null
  onClose: () => void
}

export function ExerciseFormDialog({ open, exercise, onClose }: ExerciseFormDialogProps) {
  const createMutation = useCreateExercise()
  const updateMutation = useUpdateExercise()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    reset,
    setError,
    clearErrors,
    control,
    formState: { errors },
  } = useForm<ExerciseFormValues>({ defaultValues })
  const isPending = createMutation.isPending || updateMutation.isPending

  useEffect(() => {
    if (!open) {
      return
    }

    setSubmitError(null)
    reset(
      exercise
        ? {
            name: exercise.name,
            muscleGroup: exercise.muscleGroup,
            equipment: exercise.equipment ?? '',
            description: exercise.description ?? '',
          }
        : defaultValues,
    )
  }, [exercise, open, reset])

  const onSubmit = (values: ExerciseFormValues) => {
    setSubmitError(null)
    clearErrors()

    const result = exerciseSchema.safeParse(values)

    if (!result.success) {
      if (applyZodIssues(result.error, setError) === 0) {
        setSubmitError('Revisa los datos del ejercicio.')
      }
      return
    }

    const input = {
      name: result.data.name,
      muscleGroup: result.data.muscleGroup,
      equipment: result.data.equipment || null,
      description: result.data.description || null,
    }

    const save = async () => {
      try {
        if (exercise) {
          await updateMutation.mutateAsync({ id: exercise.id, input })
        } else {
          await createMutation.mutateAsync(input)
        }
        onClose()
      } catch (error: unknown) {
        if (error instanceof HttpError) {
          if (applyHttpIssues(error, setError)) {
            setSubmitError('Revisa los campos marcados.')
            return
          }

          if (error.status === 409) {
            setError('name', {
              type: 'server',
              message: 'Ya existe un ejercicio con este nombre.',
            })
            setSubmitError('Revisa los campos marcados.')
            return
          }

          setSubmitError(error.message)
          return
        }

        setSubmitError('No fue posible guardar el ejercicio.')
      }
    }

    void save()
  }

  return (
    <Dialog open={open} onClose={isPending ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{exercise ? 'Editar ejercicio' : 'Nuevo ejercicio'}</DialogTitle>
      <Stack component="form" noValidate onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          <Stack spacing={2}>
            {submitError && <Alert severity="error">{submitError}</Alert>}
            <TextField
              label="Nombre"
              fullWidth
              {...register('name')}
              error={Boolean(errors.name)}
              helperText={errors.name?.message}
            />
            <Controller
              control={control}
              name="muscleGroup"
              render={({ field }) => (
                <TextField
                  select
                  label="Grupo muscular"
                  fullWidth
                  {...field}
                  error={Boolean(errors.muscleGroup)}
                  helperText={errors.muscleGroup?.message}
                >
                  {muscleGroups.map((group) => (
                    <MenuItem key={group} value={group}>
                      {muscleGroupLabels[group]}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
            <TextField
              label="Equipamiento"
              fullWidth
              {...register('equipment')}
              error={Boolean(errors.equipment)}
              helperText={errors.equipment?.message ?? 'Opcional'}
            />
            <TextField
              label="Descripción"
              fullWidth
              multiline
              minRows={3}
              {...register('description')}
              error={Boolean(errors.description)}
              helperText={errors.description?.message ?? 'Opcional'}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={isPending}>
            Cancelar
          </Button>
          <Button type="submit" variant="contained" disabled={isPending}>
            {isPending ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogActions>
      </Stack>
    </Dialog>
  )
}
