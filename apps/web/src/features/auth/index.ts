export { AuthProvider, LoginPage, useAuth } from './hooks'
export { ProtectedRoute, RoleGuard, canAccessRole } from './guards'
export {
  canManageClients,
  canManageCoaches,
  canViewClientAttendance,
  canViewClientMembership,
  canViewClientProgress,
  canViewClients,
  canViewCoaches,
  clientManageRoles,
  clientViewRoles,
  coachManageRoles,
  coachViewRoles,
} from './permissions'
export type { AuthSession, AuthUser, LoginResponse } from './types'
