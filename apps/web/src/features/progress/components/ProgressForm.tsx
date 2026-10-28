import { Alert, Button, Grid, Stack, TextField } from '@mui/material'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { applyHttpIssues, applyZodIssues } from '../../../lib/forms/validation'
import { HttpError } from '../../../lib/http'
import { useCreateProgress } from '../hooks'
import type { ProgressInput, ProgressRecord } from '../types'

interface ProgressFormValues {
  measuredAt: string
  weightKg: string
  heightCm: string
  bodyFatPct: string
  muscleKg: string
  chestCm: string
  waistCm: string
  hipCm: string
  armCm: string
  thighCm: string
  notes: string
}

const measurementFields = [
  'weightKg',
  'heightCm',
  'bodyFatPct',
  'muscleKg',
  'chestCm',
  'waistCm',
  'hipCm',
  'armCm',
  'thighCm',
] as const

function numberField(max?: number) {
  return z
    .string()
    .trim()
    .refine(
      (value) =>
        value === '' ||
        (/^\d+(\.\d+)?$/.test(value) &&
          Number(value) >= 0 &&
          (max === undefined || Number(value) <= max)),
      max === undefined
        ? 'Ingresa un número no negativo o deja vacío.'
        : `Ingresa un valor entre 0 y ${max} o deja vacío.`,
    )
}

const progressSchema = z
  .object({
    measuredAt: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Selecciona una fecha válida.'),
    weightKg: numberField(999.99),
    heightCm: numberField(999.99),
    bodyFatPct: numberField(100),
    muscleKg: numberField(999.99),
    chestCm: numberField(999.99),
    waistCm: numberField(999.99),
    hipCm: numberField(999.99),
    armCm: numberField(999.99),
    thighCm: numberField(999.99),
    notes: z.string().trim().max(2000, 'Máximo 2000 caracteres.'),
  })
  .refine(
    (values) => measurementFields.some((field) => values[field] !== ''),
    {
      message: 'Registra al menos una medición.',
      path: ['weightKg'],
    },
  )

function todayDateString(): string {
  return new Date().toISOString().slice(0, 10)
}

const defaultValues: ProgressFormValues = {
  measuredAt: todayDateString(),
  weightKg: '',
  heightCm: '',
  bodyFatPct: '',
  muscleKg: '',
  chestCm: '',
  waistCm: '',
  hipCm: '',
  armCm: '',
  thighCm: '',
  notes: '',
}

interface ProgressFormProps {
  clientId?: number
  clientName?: string
  onSaved: (record: ProgressRecord) => void
}

export function ProgressForm({ clientId, clientName, onSaved }: ProgressFormProps) {
  const createMutation = useCreateProgress()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    reset,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<ProgressFormValues>({ defaultValues })

  const onSubmit = (values: ProgressFormValues) => {
    setSubmitError(null)
    clearErrors()

    const result = progressSchema.safeParse(values)

    if (!result.success) {
      if (applyZodIssues(result.error, setError) === 0) {
        setSubmitError('Revisa los datos de la medición.')
      }
      return
    }

    const optionalNumber = (value: string): number | null =>
      value === '' ? null : Number(value)

    const input: ProgressInput = {
      ...(clientId === undefined ? {} : { clientId }),
      measuredAt: result.data.measuredAt,
      weightKg: optionalNumber(result.data.weightKg),
      heightCm: optionalNumber(result.data.heightCm),
      bodyFatPct: optionalNumber(result.data.bodyFatPct),
      muscleKg: optionalNumber(result.data.muscleKg),
      chestCm: optionalNumber(result.data.chestCm),
      waistCm: optionalNumber(result.data.waistCm),
      hipCm: optionalNumber(result.data.hipCm),
      armCm: optionalNumber(result.data.armCm),
      thighCm: optionalNumber(result.data.thighCm),
      notes: result.data.notes || null,
    }

    const save = async () => {
      try {
        const record = await createMutation.mutateAsync(input)
        reset({ ...defaultValues, measuredAt: result.data.measuredAt })
        onSaved(record)
      } catch (error: unknown) {
        if (error instanceof HttpError) {
          if (applyHttpIssues(error, setError)) {
            setSubmitError('Revisa los campos marcados.')
            return
          }

          setSubmitError(error.message)
          return
        }

        setSubmitError('No fue posible registrar la medición.')
      }
    }

    void save()
  }

  return (
    <Stack component="form" noValidate spacing={2} onSubmit={handleSubmit(onSubmit)}>
      {submitError && <Alert severity="error">{submitError}</Alert>}
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            label="Fecha de medición"
            type="date"
            fullWidth
            {...register('measuredAt')}
            error={Boolean(errors.measuredAt)}
            helperText={errors.measuredAt?.message}
            slotProps={{ inputLabel: { shrink: true } }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            label="Peso (kg)"
            type="number"
            fullWidth
            {...register('weightKg')}
            error={Boolean(errors.weightKg)}
            helperText={errors.weightKg?.message ?? 'Opcional'}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            label="Altura (cm)"
            type="number"
            fullWidth
            {...register('heightCm')}
            error={Boolean(errors.heightCm)}
            helperText={errors.heightCm?.message ?? 'Opcional'}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            label="Grasa corporal (%)"
            type="number"
            fullWidth
            {...register('bodyFatPct')}
            error={Boolean(errors.bodyFatPct)}
            helperText={errors.bodyFatPct?.message ?? 'Opcional, entre 0 y 100'}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            label="Músculo (kg)"
            type="number"
            fullWidth
            {...register('muscleKg')}
            error={Boolean(errors.muscleKg)}
            helperText={errors.muscleKg?.message ?? 'Opcional'}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            label="Pecho (cm)"
            type="number"
            fullWidth
            {...register('chestCm')}
            error={Boolean(errors.chestCm)}
            helperText={errors.chestCm?.message ?? 'Opcional'}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            label="Cintura (cm)"
            type="number"
            fullWidth
            {...register('waistCm')}
            error={Boolean(errors.waistCm)}
            helperText={errors.waistCm?.message ?? 'Opcional'}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            label="Cadera (cm)"
            type="number"
            fullWidth
            {...register('hipCm')}
            error={Boolean(errors.hipCm)}
            helperText={errors.hipCm?.message ?? 'Opcional'}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            label="Brazo (cm)"
            type="number"
            fullWidth
            {...register('armCm')}
            error={Boolean(errors.armCm)}
            helperText={errors.armCm?.message ?? 'Opcional'}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            label="Muslo (cm)"
            type="number"
            fullWidth
            {...register('thighCm')}
            error={Boolean(errors.thighCm)}
            helperText={errors.thighCm?.message ?? 'Opcional'}
          />
        </Grid>
        <Grid size={{ xs: 12 }}>
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
      <Stack
        sx={{
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'stretch', sm: 'center' },
          gap: 1,
        }}
      >
        <Alert severity="info" sx={{ flex: 1 }}>
          {clientName
            ? `La medición se registrará para ${clientName}.`
            : 'La medición se registrará en tu historial personal.'}
        </Alert>
        <Button type="submit" variant="contained" disabled={createMutation.isPending}>
          {createMutation.isPending ? 'Guardando...' : 'Registrar medición'}
        </Button>
      </Stack>
    </Stack>
  )
}
