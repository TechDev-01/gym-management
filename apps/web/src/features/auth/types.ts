import type { UserRole } from '../../types/navigation'

export const userRoles = ['ADMIN', 'RECEPTION', 'COACH', 'CLIENT'] as const

export interface AuthUser {
  id: string
  email: string
  role: UserRole
  clientId: number | null
  coachId: number | null
}

export interface LoginResponse {
  accessToken: string
  user: {
    id: string
    email: string
    role: string
    clientId: number | null
    coachId: number | null
  }
}

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
