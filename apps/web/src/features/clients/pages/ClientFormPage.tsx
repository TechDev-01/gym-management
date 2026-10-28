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
import { useClient, useCreateClient, useUpdateClient } from '../hooks'

interface ClientFormValues {
  email: string
  password: string
  dni: string
  name: string
  lastName: string
  phone: string
}

const clientSchema = z.object({
  email: z.string().trim().email('Ingresa un correo válido.'),
  password: z
    .string()
    .trim()
    .refine((value) => value === '' || value.length >= 8, {
      message: 'La contraseña debe tener al menos 8 caracteres.',
    }),
  dni: z.string().trim().min(1, 'El DNI es obligatorio.'),
  name: z.string().trim().min(1, 'El nombre es obligatorio.'),
  lastName: z.string().trim().min(1, 'El apellido es obligatorio.'),
  phone: z.string().trim().min(1, 'El teléfono es obligatorio.'),
})

const defaultValues: ClientFormValues = {
  email: '',
  password: '',
  dni: '',
  name: '',
  lastName: '',
  phone: '',
}

export function ClientFormPage({ editing = false }: { editing?: boolean }) {
  const navigate = useNavigate()
  const { id = '' } = useParams()
  const clientId = Number(id)
  const clientQuery = useClient(clientId, editing)
  const createMutation = useCreateClient()
  const updateMutation = useUpdateClient(clientId)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [pendingValues, setPendingValues] = useState<ClientFormValues | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const {
    register,
    handleSubmit,
    reset,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<ClientFormValues>({ defaultValues })
  const isPending = createMutation.isPending || updateMutation.isPending

  useEffect(() => {
    const client = clientQuery.data

    if (!client) {
      return
    }

    reset({
      email: client.email,
      password: '',
      dni: client.dni,
      name: client.name,
      lastName: client.lastName,
      phone: client.phone,
    })
  }, [clientQuery.data, reset])

  if (editing && clientQuery.isLoading) {
    return (
      <AppShell>
        <LoadingState label="Cargando cliente..." />
      </AppShell>
    )
  }

  if (editing && (!Number.isInteger(clientId) || clientId <= 0)) {
    return (
      <AppShell>
        <ErrorState message="El cliente solicitado no es válido." />
      </AppShell>
    )
  }

  if (editing && clientQuery.isError) {
    return (
      <AppShell>
        <ErrorState
          message={
            clientQuery.error instanceof Error
              ? clientQuery.error.message
              : 'No fue posible cargar el cliente.'
          }
        />
      </AppShell>
    )
  }

  const saveClient = async (values: ClientFormValues) => {
    setSubmitError(null)

    try {
      const input = {
        email: values.email,
        dni: values.dni,
        name: values.name,
        lastName: values.lastName,
        phone: values.phone,
      }
      const client = editing
        ? await updateMutation.mutateAsync(input)
        : await createMutation.mutateAsync({
            ...input,
            password: values.password || undefined,
          })

      navigate(`/clients/${client.id}`, {
        replace: true,
        state: {
          message: editing
            ? 'Cliente actualizado correctamente.'
            : 'Cliente creado correctamente.',
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

      setSubmitError('No fue posible guardar el cliente.')
    } finally {
      setConfirmOpen(false)
      setPendingValues(null)
    }
  }

  const onSubmit = (values: ClientFormValues) => {
    setSubmitError(null)
    clearErrors()

    const result = clientSchema.safeParse(values)

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

    void saveClient(result.data)
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow={editing ? 'Clientes' : 'Alta'}
        title={editing ? 'Editar cliente' : 'Nuevo cliente'}
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
          {!editing && (
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Contraseña inicial (opcional)"
                type="password"
                fullWidth
                autoComplete="new-password"
                {...register('password')}
                error={Boolean(errors.password)}
                helperText={errors.password?.message ?? 'Mínimo 8 caracteres si se define.'}
              />
            </Grid>
          )}
        </Grid>
        <Stack sx={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 1 }}>
          <Button type="button" onClick={() => navigate('/clients')}>
            Cancelar
          </Button>
          <Button type="submit" variant="contained" disabled={isPending}>
            {isPending ? 'Guardando...' : 'Guardar'}
          </Button>
        </Stack>
      </Stack>
      <ConfirmDialog
        open={confirmOpen}
        title="Confirmar alta de cliente"
        description={`Se creará el perfil de ${pendingValues?.name ?? ''} ${pendingValues?.lastName ?? ''} con el correo ${pendingValues?.email ?? ''}.`}
        confirmLabel="Crear cliente"
        loading={isPending}
        onConfirm={() => {
          if (pendingValues) {
            void saveClient(pendingValues)
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
