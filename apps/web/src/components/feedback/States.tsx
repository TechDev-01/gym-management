import { Alert, CircularProgress, Stack, Typography } from '@mui/material'

export function LoadingState({ label = 'Cargando...' }: { label?: string }) {
  return <Stack sx={{ alignItems: 'center', gap: 1, py: 5 }}><CircularProgress size={24} /><Typography color="text.secondary">{label}</Typography></Stack>
}

export function ErrorState({ message = 'No pudimos cargar la información.' }: { message?: string }) {
  return <Alert severity="error">{message}</Alert>
}

export function EmptyState({ message = 'No hay información para mostrar.' }: { message?: string }) {
  return <Stack sx={{ alignItems: 'center', py: 5 }}><Typography color="text.secondary">{message}</Typography></Stack>
}
