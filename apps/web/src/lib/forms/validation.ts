import type { FieldValues, Path, UseFormSetError } from 'react-hook-form'
import type { ZodError } from 'zod'
import type { HttpError } from '../http'

export function applyZodIssues<T extends FieldValues>(
  error: ZodError,
  setError: UseFormSetError<T>,
): number {
  let applied = 0

  for (const issue of error.issues) {
    const field = issue.path[0]

    if (typeof field === 'string') {
      setError(field as Path<T>, { type: 'validation', message: issue.message })
      applied += 1
    }
  }

  return applied
}

export function applyHttpIssues<T extends FieldValues>(
  error: HttpError,
  setError: UseFormSetError<T>,
): boolean {
  if (!Array.isArray(error.details)) {
    return false
  }

  let applied = false

  for (const issue of error.details) {
    if (!issue || typeof issue !== 'object') {
      continue
    }

    const candidate = issue as { path?: unknown; message?: unknown }
    const field = Array.isArray(candidate.path) ? candidate.path[0] : undefined

    if (typeof field === 'string' && typeof candidate.message === 'string') {
      setError(field as Path<T>, { type: 'server', message: candidate.message })
      applied = true
    }
  }

  return applied
}

export function applyConflictMessage<T extends FieldValues>(
  error: HttpError,
  setError: UseFormSetError<T>,
): boolean {
  if (error.status !== 409) {
    return false
  }

  const message = error.message.toLowerCase()

  if (message.includes('email')) {
    setError('email' as Path<T>, {
      type: 'server',
      message: 'Este correo ya está registrado.',
    })
    return true
  }

  if (message.includes('dni')) {
    setError('dni' as Path<T>, {
      type: 'server',
      message: 'Este DNI ya está registrado.',
    })
    return true
  }

  return false
}
