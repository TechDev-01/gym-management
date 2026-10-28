import { Alert, Button, Grid, MenuItem, Stack, TextField, Typography } from '@mui/material'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { ErrorState, LoadingState } from '../../../components/feedback/States'
import { AppShell } from '../../../components/layout/AppShell'
import { PageHeader } from '../../../components/layout/PageHeader'
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog'
import { Panel } from '../../../components/ui/Panel'
import { HttpError } from '../../../lib/http'
import { applyZodIssues } from '../../../lib/forms/validation'
import { formatCurrency } from '../../../utils/format'
import { canManageSubscriptions, useAuth } from '../../auth'
import { useClients } from '../../clients/hooks'
import { paymentMethodLabel } from '../../payments/status'
import type { PaymentMethod } from '../../payments/types'
import { useCreateSubscription, useMemberships } from '../hooks'
import type { SubscriptionWithCheckout } from '../types'

interface SubscriptionFormValues {
  clientId: string
  membershipId: string
  method: PaymentMethod
}

const subscriptionSchema = z.object({
  clientId: z.string().trim().regex(/^\d+$/, 'Selecciona un cliente válido.'),
  membershipId: z.string().trim().regex(/^\d+$/, 'Selecciona una membresía válida.'),
  method: z.enum(['CARD', 'CASH', 'TRANSFER']),
})

const methodOptions: Array<{ value: PaymentMethod; label: string }> = [
  { value: 'CASH', label: 'Efectivo' },
  { value: 'TRANSFER', label: 'Transferencia' },
  { value: 'CARD', label: 'Tarjeta (Stripe)' },
]

function errorMessage(error: unknown): string {
  return error instanceof HttpError || error instanceof Error
    ? error.message
    : 'No fue posible crear la suscripción.'
}

export function SubscriptionFormPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const canSelectClient = canManageSubscriptions(user?.role)
  const clientsQuery = useClients(canSelectClient)
  const membershipsQuery = useMemberships(false)
  const createMutation = useCreateSubscription()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [pendingValues, setPendingValues] = useState<SubscriptionFormValues | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [checkout, setCheckout] = useState<SubscriptionWithCheckout | null>(null)
  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    watch,
    formState: { errors },
  } = useForm<SubscriptionFormValues>({
    defaultValues: {
      clientId: user?.clientId ? String(user.clientId) : '',
      membershipId: '',
      method: 'CASH',
    },
  })

  const selectedMembershipId = watch('membershipId')
  const selectedMembership = useMemo(
    () => membershipsQuery.data?.find((membership) => String(membership.id) === selectedMembershipId),
    [membershipsQuery.data, selectedMembershipId],
  )
  const selectedClientId = watch('clientId')
  const selectedClient = useMemo(
    () => (clientsQuery.data ?? []).find((client) => String(client.id) === selectedClientId),
    [clientsQuery.data, selectedClientId],
  )
  const isPending = createMutation.isPending

  const saveSubscription = async (values: SubscriptionFormValues) => {
    setSubmitError(null)

    try {
      const subscription = await createMutation.mutateAsync({
        membershipId: Number(values.membershipId),
        input: {
          clientId: Number(values.clientId),
          membershipId: Number(values.membershipId),
          method: values.method,
        },
      })

      setConfirmOpen(false)
      setPendingValues(null)

      if (subscription.checkoutUrl) {
        setCheckout(subscription)
        return
      }

      navigate(`/subscriptions/${subscription.id}`, {
        replace: true,
        state: { message: 'Suscripción creada correctamente.' },
      })
    } catch (error: unknown) {
      setSubmitError(errorMessage(error))
      setConfirmOpen(false)
      setPendingValues(null)
    }
  }

  const onSubmit = (values: SubscriptionFormValues) => {
    setSubmitError(null)
    clearErrors()

    if (!user?.clientId && !canSelectClient) {
      setSubmitError('Tu usuario no tiene un cliente asociado.')
      return
    }

    const result = subscriptionSchema.safeParse(values)

    if (!result.success) {
      if (applyZodIssues(result.error, setError) === 0) {
        setSubmitError('Revisa los datos del formulario.')
      }
      return
    }

    setPendingValues(result.data)
    setConfirmOpen(true)
  }

  if (checkout) {
    return (
      <AppShell>
        <PageHeader
          eyebrow="Pago con tarjeta"
          title="Suscripción pendiente de pago"
          subtitle="Stripe confirmará el pago y la suscripción se activará automáticamente."
        />
        <Stack spacing={2} sx={{ maxWidth: 720 }}>
          <Alert severity="success">
            La suscripción #{checkout.id} fue creada y está pendiente de confirmación.
          </Alert>
          <Panel title="Continuar con el pago">
            <Stack spacing={2} sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary">
                El enlace de Checkout fue generado por la API. Esta aplicación no maneja
                claves privadas de Stripe.
              </Typography>
              {checkout.checkoutUrl ? (
                <Button
                  component="a"
                  href={checkout.checkoutUrl}
                  target="_blank"
                  rel="noreferrer"
                  variant="contained"
                  sx={{ alignSelf: 'flex-start' }}
                >
                  Continuar en Stripe
                </Button>
              ) : (
                <Alert severity="info">
                  Stripe no devolvió una URL de Checkout. Revisa el estado de la suscripción
                  desde su detalle.
                </Alert>
              )}
              <Button
                variant="outlined"
                onClick={() => navigate(`/subscriptions/${checkout.id}`, { replace: true })}
                sx={{ alignSelf: 'flex-start' }}
              >
                Ver suscripción
              </Button>
            </Stack>
          </Panel>
        </Stack>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow="Contratación"
        title="Nueva suscripción"
        subtitle="Selecciona el cliente, el plan y el método de pago."
      />
      <Stack
        component="form"
        noValidate
        spacing={2}
        onSubmit={handleSubmit(onSubmit)}
        sx={{ maxWidth: 820 }}
      >
        {submitError && <Alert severity="error">{submitError}</Alert>}
        {membershipsQuery.isLoading && <LoadingState label="Cargando membresías..." />}
        {membershipsQuery.isError && (
          <ErrorState
            message={
              membershipsQuery.error instanceof Error
                ? membershipsQuery.error.message
                : 'No fue posible cargar las membresías.'
            }
          />
        )}
        {canSelectClient && clientsQuery.isLoading && <LoadingState label="Cargando clientes..." />}
        {canSelectClient && clientsQuery.isError && (
          <ErrorState
            message={
              clientsQuery.error instanceof Error
                ? clientsQuery.error.message
                : 'No fue posible cargar los clientes.'
            }
          />
        )}
        <Grid container spacing={2}>
          {canSelectClient ? (
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                select
                label="Cliente"
                fullWidth
                {...register('clientId')}
                error={Boolean(errors.clientId)}
                helperText={errors.clientId?.message}
              >
                {(clientsQuery.data ?? [])
                  .filter((client) => client.isActive)
                  .map((client) => (
                    <MenuItem key={client.id} value={String(client.id)}>
                      {client.name} {client.lastName} · {client.dni}
                    </MenuItem>
                  ))}
              </TextField>
            </Grid>
          ) : (
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Cliente"
                fullWidth
                value={user?.email ?? 'Cliente asociado'}
                slotProps={{ input: { readOnly: true } }}
              />
            </Grid>
          )}
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              select
              label="Membresía"
              fullWidth
              {...register('membershipId')}
              error={Boolean(errors.membershipId)}
              helperText={errors.membershipId?.message}
            >
              {(membershipsQuery.data ?? []).map((membership) => (
                <MenuItem key={membership.id} value={String(membership.id)}>
                  {membership.name} · {formatCurrency(membership.priceAmount, membership.currency)}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              select
              label="Método de pago"
              fullWidth
              {...register('method')}
              error={Boolean(errors.method)}
              helperText={errors.method?.message}
            >
              {methodOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
        </Grid>
        {selectedMembership && (
          <Panel title="Resumen del plan">
            <Stack spacing={1} sx={{ mt: 2 }}>
              <Typography>{selectedMembership.name}</Typography>
              <Typography variant="body2" color="text.secondary">
                {selectedMembership.durationDays} días ·{' '}
                {selectedMembership.maxDaysPerWeek
                  ? `${selectedMembership.maxDaysPerWeek} días por semana`
                  : 'Acceso ilimitado'}
              </Typography>
              <Typography variant="h6">
                {formatCurrency(selectedMembership.priceAmount, selectedMembership.currency)}
              </Typography>
            </Stack>
          </Panel>
        )}
        <Stack sx={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 1 }}>
          <Button type="button" onClick={() => navigate('/subscriptions')}>
            Cancelar
          </Button>
          <Button type="submit" variant="contained" disabled={isPending}>
            {isPending ? 'Creando...' : 'Crear suscripción'}
          </Button>
        </Stack>
      </Stack>
      <ConfirmDialog
        open={confirmOpen}
        title="Confirmar nueva suscripción"
        description={`Se contratará "${selectedMembership?.name ?? ''}" para ${
          selectedClient ? `${selectedClient.name} ${selectedClient.lastName}` : user?.email ?? 'el cliente'
        } con pago en ${pendingValues ? paymentMethodLabel(pendingValues.method) : 'el método seleccionado'}.`}
        confirmLabel="Crear suscripción"
        loading={isPending}
        onConfirm={() => {
          if (pendingValues) {
            void saveSubscription(pendingValues)
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
