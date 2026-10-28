import { HttpError } from '../../lib/http'

const knownMessages: Array<{ fragment: string; message: string }> = [
  {
    fragment: 'does not have an active subscription',
    message:
      'El cliente no tiene una membresía activa. Revisa la suscripción antes de registrar la entrada.',
  },
  {
    fragment: 'already has an open attendance',
    message:
      'El cliente ya tiene una entrada abierta. Registra la salida antes de un nuevo check-in.',
  },
  {
    fragment: 'weekly attendance limit',
    message:
      'El cliente alcanzó el límite semanal de asistencias permitido por su membresía.',
  },
  {
    fragment: 'already closed',
    message: 'La asistencia ya está cerrada.',
  },
  {
    fragment: 'active client not found',
    message: 'El cliente no existe o está inactivo.',
  },
  {
    fragment: 'clients can only check in themselves',
    message: 'No tienes permiso para registrar la entrada de otro cliente.',
  },
  {
    fragment: 'attendance not found',
    message: 'No se encontró el registro de asistencia.',
  },
  {
    fragment: 'forbidden',
    message: 'No tienes permiso para realizar esta acción.',
  },
]

export function attendanceErrorMessage(
  error: unknown,
  fallback = 'No fue posible actualizar la asistencia.',
): string {
  if (!(error instanceof HttpError) && !(error instanceof Error)) {
    return fallback
  }

  const normalized = error.message.toLowerCase()
  const known = knownMessages.find((entry) => normalized.includes(entry.fragment))

  return known?.message ?? (error.message || fallback)
}
