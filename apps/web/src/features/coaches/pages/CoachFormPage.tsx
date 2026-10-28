import { Alert, Button, Grid, Stack, TextField } from '@mui/material'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate, useParams } from 'react-router-dom'
import { z } from 'zod'
import { ErrorState, LoadingState } from '../../../components/feedback/States'
import { AppShell } from '../../../components/layout/AppShell'
import { PageHeader } from '../../../components/layout/PageHeader'
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog'
import { HttpError } from '../../../lib/http'
import { applyConflictMessage, applyHttpIssues, applyZodIssues } from '../../../lib/forms/validation'
import { useCoach, useCreateCoach, useUpdateCoach } from '../hooks'
import type { CoachInput } from '../types'

const coachSchema = z.object({
  email: z.string().trim().email('Ingresa un correo válido.'),
  dni: z.string().trim().min(1, 'El DNI es obligatorio.'),
  name: z.string().trim().min(1, 'El nombre es obligatorio.'),
  lastName: z.string().trim().min(1, 'El apellido es obligatorio.'),
  phone: z.string().trim().min(1, 'El teléfono es obligatorio.'),
})

const defaultValues: CoachInput = {
  email: '',
  dni: '',
  name: '',
  lastName: '',
  phone: '',
}

export function CoachFormPage({ editing = false }: { editing?: boolean }) {
  const navigate = useNavigate()
  const { id = '' } = useParams()
  const coachId = Number(id)
  const coachQuery = useCoach(coachId, editing)
  const createMutation = useCreateCoach()
  const updateMutation = useUpdateCoach(coachId)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [pendingValues, setPendingValues] = useState<CoachInput | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const {
    register,
    handleSubmit,
    reset,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<CoachInput>({ defaultValues })
  const isPending = createMutation.isPending || updateMutation.isPending

  useEffect(() => {
    const coach = coachQuery.data

    if (!coach) {
      return
    }

    reset({
      email: coach.email,
      dni: coach.dni,
      name: coach.name,
      lastName: coach.lastName,
      phone: coach.phone,
    })
  }, [coachQuery.data, reset])

  if (editing && coachQuery.isLoading) {
    return (
      <AppShell>
        <LoadingState label="Cargando entrenador..." />
      </AppShell>
    )
  }

  if (editing && (!Number.isInteger(coachId) || coachId <= 0)) {
    return (
      <AppShell>
        <ErrorState message="El entrenador solicitado no es válido." />
      </AppShell>
    )
  }

  if (editing && coachQuery.isError) {
    return (
      <AppShell>
        <ErrorState
          message={
            coachQuery.error instanceof Error
              ? coachQuery.error.message
              : 'No fue posible cargar el entrenador.'
          }
        />
      </AppShell>
    )
  }

  const saveCoach = async (values: CoachInput) => {
    setSubmitError(null)

    try {
      const coach = editing
        ? await updateMutation.mutateAsync(values)
        : await createMutation.mutateAsync(values)

      navigate(`/coaches/${coach.id}`, {
        replace: true,
        state: {
          message: editing
            ? 'Entrenador actualizado correctamente.'
            : 'Entrenador creado correctamente.',
        },
      })
    } catch (error: unknown) {
      if (error instanceof HttpError) {
        if (applyHttpIssues(error, setError) || applyConflictMessage(error, setError)) {
          setSubmitError('Revisa los campos marcados.')
          return
        }

        setSubmitError(error.message)
        return
      }

      setSubmitError('No fue posible guardar el entrenador.')
    } finally {
      setConfirmOpen(false)
      setPendingValues(null)
    }
  }

  const onSubmit = (values: CoachInput) => {
    setSubmitError(null)
    clearErrors()

    const result = coachSchema.safeParse(values)

    if (!result.success) {
      if (applyZodIssues(result.error, setError) === 0) {
        setSubmitError('Revisa los datos del formulario.')
      }

      return
    }

    if (!editing) {
      setPendingValues(result.data)
      setConfirmOpen(true)
      return
    }

    void saveCoach(result.data)
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow={editing ? 'Entrenadores' : 'Alta'}
        title={editing ? 'Editar entrenador' : 'Nuevo entrenador'}
        subtitle="Completa los datos requeridos por la API."
      />
      <Stack
        component="form"
        noValidate
        spacing={2}
        onSubmit={handleSubmit(onSubmit)}
        sx={{ maxWidth: 760 }}
      >
        {submitError && <Alert severity="error">{submitError}</Alert>}
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Nombre"
              fullWidth
              {...register('name')}
              error={Boolean(errors.name)}
              helperText={errors.name?.message}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Apellido"
              fullWidth
              {...register('lastName')}
              error={Boolean(errors.lastName)}
              helperText={errors.lastName?.message}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="DNI"
              fullWidth
              {...register('dni')}
              error={Boolean(errors.dni)}
              helperText={errors.dni?.message}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Teléfono"
              fullWidth
              {...register('phone')}
              error={Boolean(errors.phone)}
              helperText={errors.phone?.message}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Correo electrónico"
              type="email"
              fullWidth
              autoComplete="email"
              {...register('email')}
              error={Boolean(errors.email)}
              helperText={errors.email?.message}
            />
          </Grid>
        </Grid>
        <Stack sx={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 1 }}>
          <Button type="button" onClick={() => navigate('/coaches')}>
            Cancelar
          </Button>
          <Button type="submit" variant="contained" disabled={isPending}>
            {isPending ? 'Guardando...' : 'Guardar'}
          </Button>
        </Stack>
      </Stack>
      <ConfirmDialog
        open={confirmOpen}
        title="Confirmar alta de entrenador"
        description={`Se creará el perfil de ${pendingValues?.name ?? ''} ${pendingValues?.lastName ?? ''} con el correo ${pendingValues?.email ?? ''}.`}
        confirmLabel="Crear entrenador"
        loading={isPending}
        onConfirm={() => {
          if (pendingValues) {
            void saveCoach(pendingValues)
          }
        }}
        onClose={() => {
          setConfirmOpen(false)
          setPendingValues(null)
        }}
      />
    </AppShell>
  )
}
