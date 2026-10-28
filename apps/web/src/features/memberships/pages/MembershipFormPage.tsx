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
import { applyHttpIssues, applyZodIssues } from '../../../lib/forms/validation'
import { useCreateMembership, useMembership, useUpdateMembership } from '../hooks'

interface MembershipFormValues {
  name: string
  description: string
  durationDays: string
  maxDaysPerWeek: string
  priceAmount: string
  currency: string
  stripePriceId: string
}

const integerMessage = 'Ingresa un número entero válido.'

const membershipSchema = z.object({
  name: z.string().trim().min(1, 'El nombre es obligatorio.').max(50, 'Máximo 50 caracteres.'),
  description: z.string().trim().max(10000, 'Máximo 10000 caracteres.'),
  durationDays: z
    .string()
    .trim()
    .regex(/^\d+$/, integerMessage)
    .refine((value) => Number(value) > 0, 'La duración debe ser mayor a cero.'),
  maxDaysPerWeek: z
    .string()
    .trim()
    .refine(
      (value) => value === '' || (/^\d+$/.test(value) && Number(value) >= 1 && Number(value) <= 7),
      'Usa un valor entre 1 y 7, o déjalo vacío para acceso ilimitado.',
    ),
  priceAmount: z
    .string()
    .trim()
    .regex(/^\d+$/, integerMessage)
    .refine((value) => Number(value) >= 0, 'El precio no puede ser negativo.'),
  currency: z.string().trim().length(3, 'Usa un código de 3 letras.'),
  stripePriceId: z
    .string()
    .trim()
    .refine(
      (value) => value === '' || (value.startsWith('price_') && value.length > 6),
      'El identificador de precio de Stripe debe iniciar con "price_".',
    ),
})

const defaultValues: MembershipFormValues = {
  name: '',
  description: '',
  durationDays: '30',
  maxDaysPerWeek: '',
  priceAmount: '0',
  currency: 'cop',
  stripePriceId: '',
}

export function MembershipFormPage({ editing = false }: { editing?: boolean }) {
  const navigate = useNavigate()
  const { id = '' } = useParams()
  const membershipId = Number(id)
  const membershipQuery = useMembership(membershipId, editing)
  const createMutation = useCreateMembership()
  const updateMutation = useUpdateMembership(membershipId)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [pendingValues, setPendingValues] = useState<MembershipFormValues | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const {
    register,
    handleSubmit,
    reset,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<MembershipFormValues>({ defaultValues })
  const isPending = createMutation.isPending || updateMutation.isPending

  useEffect(() => {
    const membership = membershipQuery.data

    if (!membership) return

    reset({
      name: membership.name,
      description: membership.description ?? '',
      durationDays: String(membership.durationDays),
      maxDaysPerWeek: membership.maxDaysPerWeek === null ? '' : String(membership.maxDaysPerWeek),
      priceAmount: String(membership.priceAmount),
      currency: membership.currency,
      stripePriceId: membership.stripePriceId ?? '',
    })
  }, [membershipQuery.data, reset])

  if (editing && membershipQuery.isLoading) {
    return (
      <AppShell>
        <LoadingState label="Cargando membresía..." />
      </AppShell>
    )
  }

  if (editing && (!Number.isInteger(membershipId) || membershipId <= 0)) {
    return (
      <AppShell>
        <ErrorState message="La membresía solicitada no es válida." />
      </AppShell>
    )
  }

  if (editing && membershipQuery.isError) {
    return (
      <AppShell>
        <ErrorState
          message={
            membershipQuery.error instanceof Error
              ? membershipQuery.error.message
              : 'No fue posible cargar la membresía.'
          }
        />
      </AppShell>
    )
  }

  const saveMembership = async (values: MembershipFormValues) => {
    setSubmitError(null)

    const description = values.description || null
    const durationDays = Number(values.durationDays)
    const maxDaysPerWeek = values.maxDaysPerWeek === '' ? null : Number(values.maxDaysPerWeek)
    const priceAmount = Number(values.priceAmount)

    try {
      if (editing) {
        const membership = membershipQuery.data

        if (!membership) {
          setSubmitError('No fue posible cargar la membresía.')
          return
        }

        const updateInput = {
          ...(values.name !== membership.name ? { name: values.name } : {}),
          ...(description !== membership.description ? { description } : {}),
          ...(durationDays !== membership.durationDays ? { durationDays } : {}),
          ...(maxDaysPerWeek !== membership.maxDaysPerWeek ? { maxDaysPerWeek } : {}),
          ...(priceAmount !== membership.priceAmount ? { priceAmount } : {}),
        }

        if (Object.keys(updateInput).length === 0) {
          setSubmitError('No hay cambios para guardar.')
          return
        }

        await updateMutation.mutateAsync(updateInput)
      } else {
        await createMutation.mutateAsync({
          name: values.name,
          description,
          durationDays,
          maxDaysPerWeek,
          priceAmount,
          currency: values.currency.toLowerCase(),
          stripePriceId: values.stripePriceId || null,
        })
      }

      navigate('/memberships', {
        replace: true,
        state: {
          message: editing
            ? 'Membresía actualizada correctamente.'
            : 'Membresía creada correctamente.',
        },
      })
    } catch (error: unknown) {
      if (error instanceof HttpError) {
        if (applyHttpIssues(error, setError)) {
          setSubmitError('Revisa los campos marcados.')
          return
        }

        if (error.status === 409 && error.message.toLowerCase().includes('name')) {
          setError('name', { type: 'server', message: 'Ya existe una membresía con ese nombre.' })
          setSubmitError('Revisa los campos marcados.')
          return
        }

        setSubmitError(error.message)
        return
      }

      setSubmitError('No fue posible guardar la membresía.')
    } finally {
      setConfirmOpen(false)
      setPendingValues(null)
    }
  }

  const onSubmit = (values: MembershipFormValues) => {
    setSubmitError(null)
    clearErrors()

    const result = membershipSchema.safeParse(values)

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

    void saveMembership(result.data)
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow={editing ? 'Catálogo' : 'Alta'}
        title={editing ? 'Editar membresía' : 'Nueva membresía'}
        subtitle={
          editing
            ? 'La API impide cambiar precio y duración cuando la membresía ya tiene suscripciones.'
            : 'Define el plan que estará disponible para nuevas contrataciones.'
        }
      />
      <Stack
        component="form"
        noValidate
        spacing={2}
        onSubmit={handleSubmit(onSubmit)}
        sx={{ maxWidth: 820 }}
      >
        {submitError && <Alert severity="error">{submitError}</Alert>}
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 8 }}>
            <TextField
              label="Nombre"
              fullWidth
              {...register('name')}
              error={Boolean(errors.name)}
              helperText={errors.name?.message}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              label="Duración en días"
              type="number"
              fullWidth
              slotProps={{ htmlInput: { min: 1 } }}
              {...register('durationDays')}
              error={Boolean(errors.durationDays)}
              helperText={errors.durationDays?.message}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField
              label="Descripción"
              fullWidth
              multiline
              minRows={2}
              {...register('description')}
              error={Boolean(errors.description)}
              helperText={errors.description?.message}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              label="Días por semana"
              type="number"
              fullWidth
              slotProps={{ htmlInput: { min: 1, max: 7 } }}
              {...register('maxDaysPerWeek')}
              error={Boolean(errors.maxDaysPerWeek)}
              helperText={errors.maxDaysPerWeek?.message ?? 'Vacío = acceso ilimitado.'}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              label="Precio"
              type="number"
              fullWidth
              slotProps={{ htmlInput: { min: 0, step: 1 } }}
              {...register('priceAmount')}
              error={Boolean(errors.priceAmount)}
              helperText={errors.priceAmount?.message ?? 'Importe entero en la moneda del plan.'}
            />
          </Grid>
          {!editing && (
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                label="Moneda"
                fullWidth
                slotProps={{ htmlInput: { maxLength: 3 } }}
                {...register('currency')}
                error={Boolean(errors.currency)}
                helperText={errors.currency?.message ?? 'Código ISO de 3 letras. Por defecto: COP.'}
              />
            </Grid>
          )}
          {!editing && (
            <Grid size={{ xs: 12 }}>
              <TextField
                label="Precio de Stripe (opcional)"
                fullWidth
                {...register('stripePriceId')}
                error={Boolean(errors.stripePriceId)}
                helperText={
                  errors.stripePriceId?.message ??
                  'Identificador price_... para pagos con tarjeta. Nunca se muestran claves privadas.'
                }
              />
            </Grid>
          )}
        </Grid>
        <Stack sx={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 1 }}>
          <Button type="button" onClick={() => navigate('/memberships')}>
            Cancelar
          </Button>
          <Button type="submit" variant="contained" disabled={isPending}>
            {isPending ? 'Guardando...' : 'Guardar'}
          </Button>
        </Stack>
      </Stack>
      <ConfirmDialog
        open={confirmOpen}
        title="Confirmar alta de membresía"
        description={`Se creará el plan "${pendingValues?.name ?? ''}" por ${pendingValues?.durationDays ?? ''} días.`}
        confirmLabel="Crear membresía"
        loading={isPending}
        onConfirm={() => {
          if (pendingValues) {
            void saveMembership(pendingValues)
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
