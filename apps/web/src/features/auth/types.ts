import type { UserRole } from '../../types/navigation'
import type { components } from '../../types/generated/api'

export const userRoles = ['ADMIN', 'RECEPTION', 'COACH', 'CLIENT'] as const

export interface AuthUser {
  id: string
  email: string
  role: UserRole
  clientId: number | null
  coachId: number | null
}

export type LoginResponse = components['schemas']['AuthResponse']

export interface AuthSession {
  accessToken: string
  user: AuthUser
}

export function isUserRole(value: string): value is UserRole {
  return userRoles.includes(value as UserRole)
}

export function toAuthUser(response: LoginResponse): AuthUser {
  if (!isUserRole(response.user.role)) {
    throw new Error('El rol recibido por la API no está soportado.')
  }

  return {
    ...response.user,
    role: response.user.role,
  }
}
