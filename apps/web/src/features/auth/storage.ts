import { isUserRole, type AuthSession } from './types'

export const authSessionStorageKey = 'gym-management.auth-session'

export function getStoredSession(): AuthSession | null {
  const serializedSession = sessionStorage.getItem(authSessionStorageKey)

  if (!serializedSession) {
    return null
  }

  try {
    const session = JSON.parse(serializedSession) as AuthSession

    if (!session.accessToken || !session.user?.id || !session.user?.role || !isUserRole(session.user.role)) {
      return null
    }

    return session
  } catch {
    return null
  }
}

export function storeSession(session: AuthSession): void {
  sessionStorage.setItem(authSessionStorageKey, JSON.stringify(session))
}

export function clearStoredSession(): void {
  sessionStorage.removeItem(authSessionStorageKey)
}
