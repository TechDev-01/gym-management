import { Alert, Box, Button, CircularProgress, Stack, TextField, Typography } from '@mui/material'
import { createContext, useContext, useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { HttpError, clearAccessToken, configureHttpClient, setAccessToken } from '../../lib/http'
import { loginRequest } from './api'
import { clearStoredSession, getStoredSession, storeSession } from './storage'
import { toAuthUser, type AuthSession, type AuthUser } from './types'

interface AuthContextValue {
  user: AuthUser | null
  isAuthenticated: boolean
  isLoading: boolean
  isRestoring: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null)
  const [isRestoring, setIsRestoring] = useState(true)
  const [isLoading, setIsLoading] = useState(false)

  const logout = () => {
    clearAccessToken()
    clearStoredSession()
    setSession(null)
  }

  useEffect(() => {
    const storedSession = getStoredSession()

    if (storedSession) {
      setAccessToken(storedSession.accessToken)
      setSession(storedSession)
    }

    setIsRestoring(false)
  }, [])

  useEffect(() => {
    configureHttpClient({
      onUnauthorized: () => {
        logout()

        if (window.location.pathname !== '/login') {
          window.location.assign('/login')
        }
      },
    })
  })

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session?.user ?? null,
      isAuthenticated: session !== null,
      isLoading,
      isRestoring,
      login: async (email, password) => {
        setIsLoading(true)

        try {
          const response = await loginRequest(email, password)
          const nextSession: AuthSession = {
            accessToken: response.accessToken,
            user: toAuthUser(response),
          }

          setAccessToken(nextSession.accessToken)
          storeSession(nextSession)
          setSession(nextSession)
        } finally {
          setIsLoading(false)
        }
      },
      logout,
    }),
    [isLoading, isRestoring, session],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth debe utilizarse dentro de AuthProvider.')
  }

  return context
}

export function LoginPage() {
  const { isAuthenticated, isLoading, login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true })
    }
  }, [isAuthenticated, navigate])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    if (!email.trim() || !email.includes('@') || !password) {
      setError('Ingresa un correo válido y una contraseña.')
      return
    }

    try {
      await login(email.trim(), password)
      navigate('/dashboard', { replace: true })
    } catch (cause: unknown) {
      setError(cause instanceof HttpError || cause instanceof Error ? cause.message : 'No fue posible iniciar sesión.')
    }
  }

  return (
    <Box sx={{ display: 'grid', minHeight: '100vh', placeItems: 'center', bgcolor: 'background.default', p: 2 }}>
      <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%', maxWidth: 420, p: { xs: 3, sm: 5 }, bgcolor: 'background.paper', border: 1, borderColor: 'divider', borderRadius: 1 }}>
        <Stack spacing={3}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>Bienvenido a GymFlow</Typography>
            <Typography color="text.secondary">Inicia sesión para continuar.</Typography>
          </Box>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField label="Correo electrónico" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required fullWidth />
          <TextField label="Contraseña" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required fullWidth />
          <Button type="submit" variant="contained" size="large" disabled={isLoading} fullWidth>
            {isLoading ? <CircularProgress size={22} color="inherit" /> : 'Iniciar sesión'}
          </Button>
        </Stack>
      </Box>
    </Box>
  )
}
