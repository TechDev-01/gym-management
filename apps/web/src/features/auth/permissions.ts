import type { UserRole } from '../../types/navigation'

export const clientViewRoles: UserRole[] = ['ADMIN', 'RECEPTION', 'COACH']
export const clientManageRoles: UserRole[] = ['ADMIN', 'RECEPTION']
export const coachViewRoles: UserRole[] = ['ADMIN', 'RECEPTION', 'COACH']
export const coachManageRoles: UserRole[] = ['ADMIN', 'RECEPTION']

export function canViewClients(role: UserRole | undefined): boolean {
  return role !== undefined && clientViewRoles.includes(role)
}

export function canManageClients(role: UserRole | undefined): boolean {
  return role !== undefined && clientManageRoles.includes(role)
}

export function canViewCoaches(role: UserRole | undefined): boolean {
  return role !== undefined && coachViewRoles.includes(role)
}

export function canManageCoaches(role: UserRole | undefined): boolean {
  return role !== undefined && coachManageRoles.includes(role)
}

export function canViewClientMembership(role: UserRole | undefined): boolean {
  return role === 'ADMIN' || role === 'RECEPTION'
}

export function canViewClientAttendance(role: UserRole | undefined): boolean {
  return role === 'ADMIN' || role === 'RECEPTION'
}

export function canViewClientProgress(role: UserRole | undefined): boolean {
  return role === 'ADMIN' || role === 'RECEPTION' || role === 'COACH'
}
