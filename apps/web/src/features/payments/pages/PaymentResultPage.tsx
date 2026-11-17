import { Alert, Box, Button, Stack, Typography } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'
import { useAuth } from '../../auth'

type PaymentResult = 'success' | 'cancelled'

interface PaymentResultPageProps {
  result: PaymentResult
}

const content: Record<
  PaymentResult,
  { eyebrow: string; title: string; description: string; alert: string; alertSeverity: 'info' | 'warning' }
> = {
  success: {
    eyebrow: 'Pago completado',
    title: 'Gracias por tu pago',
    description:
      'Stripe recibió tu pago. La suscripción se activará automáticamente cuando el webhook confirme la transacción.',
    alert:
      'Esta página no marca el pago como confirmado. La activación depende de la notificación segura de Stripe y puede tardar unos segundos.',
    alertSeverity: 'info',
  },
  cancelled: {
    eyebrow: 'Pago cancelado',
    title: 'No se completó el pago',
    description:
      'No se realizó ningún cargo. Puedes volver a intentarlo desde el detalle de la suscripción o contactar a recepción si necesitas ayuda.',
    alert:
      'La suscripción continúa pendiente. Si el cargo aparece en tu tarjeta, contacta al gimnasio antes de volver a pagar.',
    alertSeverity: 'warning',
  },
}

function PaymentResultPage({ result }: PaymentResultPageProps) {
  const { isAuthenticated } = useAuth()
  const copy = content[result]

  return (
    <Box sx={{ display: 'grid', minHeight: '100vh', placeItems: 'center', bgcolor: 'background.default', p: 2 }}>
      <Box
        sx={{
          width: '100%',
          maxWidth: 560,
          p: { xs: 3, sm: 5 },
          bgcolor: 'background.paper',
          border: 1,
          borderColor: 'divider',
          borderRadius: 3,
        }}
      >
        <Stack spacing={3}>
          <Box>
            <Typography
              variant="overline"
              sx={{ color: result === 'success' ? 'success.main' : 'warning.main', fontWeight: 700 }}
            >
              {copy.eyebrow}
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 700, mt: 1 }}>
              {copy.title}
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 1 }}>
              {copy.description}
            </Typography>
          </Box>
          <Alert severity={copy.alertSeverity}>{copy.alert}</Alert>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            {isAuthenticated ? (
              <Button component={RouterLink} to="/dashboard" variant="contained">
                Ir al dashboard
              </Button>
            ) : (
              <Button component={RouterLink} to="/login" variant="contained">
                Iniciar sesión
              </Button>
            )}
            <Button component={RouterLink} to="/" variant="outlined">
              Volver al inicio
            </Button>
          </Stack>
        </Stack>
      </Box>
    </Box>
  )
}

export function PaymentSuccessPage() {
  return <PaymentResultPage result="success" />
}

export function PaymentCancelledPage() {
  return <PaymentResultPage result="cancelled" />
}
