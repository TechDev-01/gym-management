import {
  Alert,
  Button,
  Grid,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useEffect, useState } from 'react'
import { Controller, useFieldArray, useForm } from 'react-hook-form'
import { useNavigate, useParams } from 'react-router-dom'
import { z } from 'zod'
import { EmptyState, ErrorState, LoadingState } from '../../../components/feedback/States'
import { AppShell } from '../../../components/layout/AppShell'
import { PageHeader } from '../../../components/layout/PageHeader'
import { Panel } from '../../../components/ui/Panel'
import { HttpError } from '../../../lib/http'
import { applyHttpIssues, applyZodIssues } from '../../../lib/forms/validation'
import { useAuth } from '../../auth'
import { useCoaches } from '../../coaches/hooks'
import { useCreateRoutine, useExercises, useRoutine, useUpdateRoutine } from '../hooks'
import { routineLevelLabels } from '../labels'
import { routineLevels, type RoutineLevel } from '../types'

interface RoutineExerciseRow {
  exerciseId: string
  dayNumber: string
  position: string
  sets: string
  reps: string
  weightKg: string
  restSeconds: string
  notes: string
}

interface RoutineFormValues {
  name: string
  description: string
  level: RoutineLevel
  createdById: string
  exercises: RoutineExerciseRow[]
}

const routineSchema = z.object({
  name: z.string().trim().min(1, 'El nombre es obligatorio.').max(100, 'Máximo 100 caracteres.'),
  description: z.string().trim().max(2000, 'Máximo 2000 caracteres.'),
  level: z.enum(routineLevels),
  createdById: z.string(),
})

const defaultValues: RoutineFormValues = {
  name: '',
  description: '',
  level: 'BEGINNER',
  createdById: '',
  exercises: [],
}

const emptyExerciseRow: RoutineExerciseRow = {
  exerciseId: '',
  dayNumber: '1',
  position: '1',
  sets: '3',
  reps: '10',
  weightKg: '',
  restSeconds: '',
  notes: '',
}

function positiveInteger(value: string): boolean {
  return /^\d+$/.test(value) && Number(value) > 0
}

export function RoutineFormPage({ editing = false }: { editing?: boolean }) {
  const navigate = useNavigate()
  const { id = '' } = useParams()
  const routineId = Number(id)
  const { user } = useAuth()
  const routineQuery = useRoutine(routineId, editing)
  const exercisesQuery = useExercises()
  const coachesQuery = useCoaches(user?.role === 'ADMIN' && !editing)
  const createMutation = useCreateRoutine()
  const updateMutation = useUpdateRoutine(routineId)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    reset,
    setError,
    clearErrors,
    control,
    watch,
    formState: { errors },
  } = useForm<RoutineFormValues>({ defaultValues })
  const { fields, append, remove } = useFieldArray({ control, name: 'exercises' })
  const isPending = createMutation.isPending || updateMutation.isPending
  const routine = routineQuery.data
  const isInactive = editing && routine !== undefined && !routine.isActive
  const exerciseRows = watch('exercises')

  useEffect(() => {
    if (!routine) {
      return
    }

    reset({
      name: routine.name,
      description: routine.description ?? '',
      level: routine.level,
      createdById: String(routine.createdById),
      exercises: [],
    })
  }, [reset, routine])

  if (editing && routineQuery.isLoading) {
    return (
      <AppShell>
        <LoadingState label="Cargando rutina..." />
      </AppShell>
    )
  }

  if (editing && (!Number.isInteger(routineId) || routineId <= 0)) {
    return (
      <AppShell>
        <ErrorState message="La rutina solicitada no es válida." />
      </AppShell>
    )
  }

  if (editing && routineQuery.isError) {
    return (
      <AppShell>
        <ErrorState
          message={
            routineQuery.error instanceof Error
              ? routineQuery.error.message
              : 'No fue posible cargar la rutina.'
          }
        />
      </AppShell>
    )
  }

  if (
    editing &&
    routine !== undefined &&
    user?.role === 'COACH' &&
    user.coachId !== routine.createdById
  ) {
    return (
      <AppShell>
        <ErrorState message="Solo el entrenador responsable puede modificar esta rutina." />
      </AppShell>
    )
  }

  const validateExerciseRows = (rows: RoutineExerciseRow[]): boolean => {
    let valid = true
    const positions = new Set<string>()

    rows.forEach((row, index) => {
      if (!row.exerciseId) {
        setError(`exercises.${index}.exerciseId`, {
          type: 'validation',
          message: 'Selecciona un ejercicio.',
        })
        valid = false
      }

      if (!positiveInteger(row.dayNumber) || Number(row.dayNumber) > 14) {
        setError(`exercises.${index}.dayNumber`, {
          type: 'validation',
          message: 'Usa un día entre 1 y 14.',
        })
        valid = false
      }

      if (!positiveInteger(row.position)) {
        setError(`exercises.${index}.position`, {
          type: 'validation',
          message: 'La posición debe ser mayor a cero.',
        })
        valid = false
      }

      if (!positiveInteger(row.sets)) {
        setError(`exercises.${index}.sets`, {
          type: 'validation',
          message: 'Las series deben ser mayores a cero.',
        })
        valid = false
      }

      if (!positiveInteger(row.reps)) {
        setError(`exercises.${index}.reps`, {
          type: 'validation',
          message: 'Las repeticiones deben ser mayores a cero.',
        })
        valid = false
      }

      if (
        row.weightKg !== '' &&
        (!/^\d+(\.\d+)?$/.test(row.weightKg) || Number(row.weightKg) < 0)
      ) {
        setError(`exercises.${index}.weightKg`, {
          type: 'validation',
          message: 'Usa un peso no negativo o deja vacío.',
        })
        valid = false
      }

      if (
        row.restSeconds !== '' &&
        (!/^\d+$/.test(row.restSeconds) || Number(row.restSeconds) < 0)
      ) {
        setError(`exercises.${index}.restSeconds`, {
          type: 'validation',
          message: 'Usa segundos enteros no negativos o deja vacío.',
        })
        valid = false
      }

      const key = `${row.dayNumber}-${row.position}`
      if (positions.has(key)) {
        setError(`exercises.${index}.position`, {
          type: 'validation',
          message: 'Hay dos ejercicios en el mismo día y posición.',
        })
        valid = false
      }
      positions.add(key)
    })

    return valid
  }

  const onSubmit = (values: RoutineFormValues) => {
    setSubmitError(null)
    clearErrors()

    const result = routineSchema.safeParse(values)

    if (!result.success) {
      if (applyZodIssues(result.error, setError) === 0) {
        setSubmitError('Revisa los datos de la rutina.')
      }
      return
    }

    const isAdminCreating = !editing && user?.role === 'ADMIN'
    const createdById = Number(result.data.createdById)

    if (isAdminCreating && (!Number.isInteger(createdById) || createdById <= 0)) {
      setError('createdById', {
        type: 'validation',
        message: 'Selecciona el entrenador responsable de la rutina.',
      })
      setSubmitError('Revisa los datos de la rutina.')
      return
    }

    if (!editing && !validateExerciseRows(values.exercises)) {
      setSubmitError('Revisa los ejercicios de la rutina.')
      return
    }

    const exercises = values.exercises.map((row) => ({
      exerciseId: Number(row.exerciseId),
      dayNumber: Number(row.dayNumber),
      position: Number(row.position),
      sets: Number(row.sets),
      reps: Number(row.reps),
      weightKg: row.weightKg === '' ? null : Number(row.weightKg),
      restSeconds: row.restSeconds === '' ? null : Number(row.restSeconds),
      notes: row.notes || null,
    }))

    const save = async () => {
      try {
        const routine = editing
          ? await updateMutation.mutateAsync({
              name: result.data.name,
              description: result.data.description || null,
              level: result.data.level,
            })
          : await createMutation.mutateAsync({
              name: result.data.name,
              description: result.data.description || null,
              level: result.data.level,
              ...(isAdminCreating ? { createdById } : {}),
              ...(exercises.length > 0 ? { exercises } : {}),
            })

        navigate(`/routines/${routine.id}`, {
          replace: true,
          state: {
            message: editing
              ? 'Rutina actualizada correctamente.'
              : 'Rutina creada correctamente.',
          },
        })
      } catch (error: unknown) {
        if (error instanceof HttpError) {
          if (applyHttpIssues(error, setError)) {
            setSubmitError('Revisa los campos marcados.')
            return
          }

          setSubmitError(error.message)
          return
        }

        setSubmitError('No fue posible guardar la rutina.')
      }
    }

    void save()
  }

  const addExerciseRow = () => {
    const lastDay = exerciseRows.at(-1)?.dayNumber ?? '1'
    const sameDay = exerciseRows.filter((row) => row.dayNumber === lastDay)
    append({
      ...emptyExerciseRow,
      exerciseId: exercisesQuery.data?.[0] ? String(exercisesQuery.data[0].id) : '',
      dayNumber: lastDay,
      position: String(sameDay.length + 1),
    })
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow={editing ? 'Editar rutina' : 'Nueva rutina'}
        title={editing ? 'Editar rutina' : 'Crear rutina'}
        subtitle={
          editing
            ? 'Actualiza los datos generales. Los ejercicios se gestionan desde el detalle.'
            : 'Define los datos generales y, si lo deseas, los ejercicios iniciales.'
        }
      />
      <Stack
        component="form"
        noValidate
        spacing={2}
        onSubmit={handleSubmit(onSubmit)}
        sx={{ maxWidth: editing ? 760 : 1100 }}
      >
        {submitError && <Alert severity="error">{submitError}</Alert>}
        {isInactive && (
          <Alert severity="warning">
            La rutina está inactiva. Reactívala desde el detalle antes de editarla.
          </Alert>
        )}
        <Panel title="Datos generales" subtitle="Información visible para entrenadores y clientes">
          <Stack spacing={2} sx={{ mt: 2 }}>
            <TextField
              label="Nombre"
              fullWidth
              {...register('name')}
              error={Boolean(errors.name)}
              helperText={errors.name?.message}
            />
            <TextField
              label="Descripción"
              fullWidth
              multiline
              minRows={2}
              {...register('description')}
              error={Boolean(errors.description)}
              helperText={errors.description?.message ?? 'Opcional'}
            />
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  control={control}
                  name="level"
                  render={({ field }) => (
                    <TextField
                      select
                      label="Nivel"
                      fullWidth
                      {...field}
                      error={Boolean(errors.level)}
                      helperText={errors.level?.message}
                    >
                      {routineLevels.map((level) => (
                        <MenuItem key={level} value={level}>
                          {routineLevelLabels[level]}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />
              </Grid>
              {!editing && user?.role === 'ADMIN' && (
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Controller
                    control={control}
                    name="createdById"
                    render={({ field }) => (
                      <TextField
                        select
                        label="Entrenador responsable"
                        fullWidth
                        {...field}
                        error={Boolean(errors.createdById)}
                        helperText={errors.createdById?.message}
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
            </Grid>
          </Stack>
        </Panel>

        {!editing && (
          <Panel
            title="Ejercicios iniciales"
            subtitle="Opcional. También puedes configurarlos después desde el detalle."
            action={
              <Button
                type="button"
                variant="outlined"
                size="small"
                onClick={addExerciseRow}
                disabled={exercisesQuery.isLoading}
              >
                Añadir fila
              </Button>
            }
          >
            <Stack spacing={2} sx={{ mt: 2 }}>
              {exercisesQuery.isLoading && <LoadingState label="Cargando ejercicios..." />}
              {exercisesQuery.isError && (
                <ErrorState
                  message={
                    exercisesQuery.error instanceof Error
                      ? exercisesQuery.error.message
                      : 'No fue posible cargar los ejercicios.'
                  }
                />
              )}
              {exercisesQuery.isSuccess && (exercisesQuery.data.length === 0) && (
                <Alert severity="info">
                  No hay ejercicios en el catálogo. Puedes crear la rutina y añadirlos
                  después desde el catálogo de ejercicios.
                </Alert>
              )}
              {fields.length === 0 && (
                <EmptyState message="No has añadido ejercicios iniciales." />
              )}
              {fields.map((field, index) => (
                <Stack
                  key={field.id}
                  spacing={1.5}
                  sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}
                >
                  <Stack
                    sx={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      Ejercicio {index + 1}
                    </Typography>
                    <Button
                      type="button"
                      size="small"
                      color="error"
                      onClick={() => remove(index)}
                    >
                      Quitar
                    </Button>
                  </Stack>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Controller
                        control={control}
                        name={`exercises.${index}.exerciseId`}
                        render={({ field: selectField }) => (
                          <TextField
                            select
                            label="Ejercicio"
                            fullWidth
                            {...selectField}
                            error={Boolean(errors.exercises?.[index]?.exerciseId)}
                            helperText={errors.exercises?.[index]?.exerciseId?.message}
                          >
                            {(exercisesQuery.data ?? []).map((exercise) => (
                              <MenuItem key={exercise.id} value={String(exercise.id)}>
                                {exercise.name}
                              </MenuItem>
                            ))}
                          </TextField>
                        )}
                      />
                    </Grid>
                    <Grid size={{ xs: 6, sm: 3 }}>
                      <TextField
                        label="Día"
                        type="number"
                        fullWidth
                        {...register(`exercises.${index}.dayNumber`)}
                        error={Boolean(errors.exercises?.[index]?.dayNumber)}
                        helperText={errors.exercises?.[index]?.dayNumber?.message}
                      />
                    </Grid>
                    <Grid size={{ xs: 6, sm: 3 }}>
                      <TextField
                        label="Posición"
                        type="number"
                        fullWidth
                        {...register(`exercises.${index}.position`)}
                        error={Boolean(errors.exercises?.[index]?.position)}
                        helperText={errors.exercises?.[index]?.position?.message}
                      />
                    </Grid>
                    <Grid size={{ xs: 6, sm: 3 }}>
                      <TextField
                        label="Series"
                        type="number"
                        fullWidth
                        {...register(`exercises.${index}.sets`)}
                        error={Boolean(errors.exercises?.[index]?.sets)}
                        helperText={errors.exercises?.[index]?.sets?.message}
                      />
                    </Grid>
                    <Grid size={{ xs: 6, sm: 3 }}>
                      <TextField
                        label="Repeticiones"
                        type="number"
                        fullWidth
                        {...register(`exercises.${index}.reps`)}
                        error={Boolean(errors.exercises?.[index]?.reps)}
                        helperText={errors.exercises?.[index]?.reps?.message}
                      />
                    </Grid>
                    <Grid size={{ xs: 6, sm: 3 }}>
                      <TextField
                        label="Peso (kg)"
                        type="number"
                        fullWidth
                        {...register(`exercises.${index}.weightKg`)}
                        error={Boolean(errors.exercises?.[index]?.weightKg)}
                        helperText={errors.exercises?.[index]?.weightKg?.message ?? 'Opcional'}
                      />
                    </Grid>
                    <Grid size={{ xs: 6, sm: 3 }}>
                      <TextField
                        label="Descanso (seg)"
                        type="number"
                        fullWidth
                        {...register(`exercises.${index}.restSeconds`)}
                        error={Boolean(errors.exercises?.[index]?.restSeconds)}
                        helperText={
                          errors.exercises?.[index]?.restSeconds?.message ?? 'Opcional'
                        }
                      />
                    </Grid>
                  </Grid>
                </Stack>
              ))}
            </Stack>
          </Panel>
        )}

        <Stack sx={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 1 }}>
          <Button type="button" onClick={() => navigate('/routines')}>
            Cancelar
          </Button>
          <Button type="submit" variant="contained" disabled={isPending || isInactive}>
            {isPending ? 'Guardando...' : 'Guardar'}
          </Button>
        </Stack>
      </Stack>
    </AppShell>
  )
}
