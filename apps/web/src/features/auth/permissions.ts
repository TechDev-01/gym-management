import type { UserRole } from '../../types/navigation'

export const clientViewRoles: UserRole[] = ['ADMIN', 'RECEPTION', 'COACH']
export const clientManageRoles: UserRole[] = ['ADMIN', 'RECEPTION']
export const coachViewRoles: UserRole[] = ['ADMIN', 'RECEPTION', 'COACH']
export const coachManageRoles: UserRole[] = ['ADMIN', 'RECEPTION']
export const membershipViewRoles: UserRole[] = ['ADMIN', 'RECEPTION', 'CLIENT']
export const membershipManageRoles: UserRole[] = ['ADMIN', 'RECEPTION']
export const membershipStatusRoles: UserRole[] = ['ADMIN']
export const subscriptionViewRoles: UserRole[] = ['ADMIN', 'RECEPTION', 'CLIENT']
export const subscriptionCreateRoles: UserRole[] = ['ADMIN', 'RECEPTION', 'CLIENT']
export const subscriptionManageRoles: UserRole[] = ['ADMIN', 'RECEPTION']
export const paymentViewRoles: UserRole[] = ['ADMIN', 'RECEPTION']

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

export function canViewMemberships(role: UserRole | undefined): boolean {
  return role !== undefined && membershipViewRoles.includes(role)
}

export function canManageMemberships(role: UserRole | undefined): boolean {
  return role !== undefined && membershipManageRoles.includes(role)
}

export function canChangeMembershipStatus(role: UserRole | undefined): boolean {
  return role !== undefined && membershipStatusRoles.includes(role)
}

export function canViewSubscriptions(role: UserRole | undefined): boolean {
  return role !== undefined && subscriptionViewRoles.includes(role)
}

export function canCreateSubscriptions(role: UserRole | undefined): boolean {
  return role !== undefined && subscriptionCreateRoles.includes(role)
}

export function canManageSubscriptions(role: UserRole | undefined): boolean {
  return role !== undefined && subscriptionManageRoles.includes(role)
}

export function canViewPayments(role: UserRole | undefined): boolean {
  return role !== undefined && paymentViewRoles.includes(role)
}

export function canViewClientAttendance(role: UserRole | undefined): boolean {
  return role === 'ADMIN' || role === 'RECEPTION'
}

export function canViewClientProgress(role: UserRole | undefined): boolean {
  return role === 'ADMIN' || role === 'RECEPTION' || role === 'COACH'
}
