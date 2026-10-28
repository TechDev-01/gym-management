import type { ReactNode } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { LoadingState } from '../../components/feedback/States'
import { useAuth } from './hooks'
import type { UserRole } from '../../types/navigation'

export function ProtectedRoute() {
  const { isAuthenticated, isRestoring } = useAuth()
  const location = useLocation()

  if (isRestoring) {
    return <LoadingState label="Restaurando sesión..." />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <Outlet />
}

export function RoleGuard({ roles, children }: { roles: UserRole[]; children?: ReactNode }) {
  const { user } = useAuth()

  if (!user || !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children ?? <Outlet />}</>
}

export function canAccessRole(userRole: UserRole, allowedRoles: UserRole[]): boolean {
  return allowedRoles.includes(userRole)
}
