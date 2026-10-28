import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AppProviders } from '../../app/providers'
import { LoginPage, ProtectedRoute, RoleGuard, useAuth } from './index'
import { authSessionStorageKey } from './storage'

const loginResponse = {
  accessToken: 'token-123',
  user: {
    id: 'user-1',
    email: 'admin@example.com',
    role: 'ADMIN',
    clientId: null,
    coachId: null,
  },
}

function renderWithAuth(ui: React.ReactNode, initialEntries = ['/login']) {
  return render(
    <AppProviders>
      <MemoryRouter initialEntries={initialEntries}>{ui}</MemoryRouter>
    </AppProviders>,
  )
}

function AuthStatus() {
  const { isAuthenticated, user } = useAuth()
  return <p>{isAuthenticated ? user?.role : 'anonymous'}</p>
}

describe('authentication flow', () => {
  beforeEach(() => {
    sessionStorage.clear()
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify(loginResponse), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      ),
    )
  })

  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
  })

  it('logs in and persists the session', async () => {
    renderWithAuth(<LoginPage />)

    fireEvent.change(screen.getByRole('textbox', { name: /correo electrónico/i }), { target: { value: 'admin@example.com' } })
    fireEvent.change(screen.getByLabelText(/contraseña/i), { target: { value: 'secret' } })
    fireEvent.click(screen.getByRole('button', { name: 'Iniciar sesión' }))

    await waitFor(() => {
      expect(sessionStorage.getItem(authSessionStorageKey)).toContain('token-123')
    })
  })

  it('restores a valid session after reload', async () => {
    sessionStorage.setItem(
      authSessionStorageKey,
      JSON.stringify({ accessToken: 'stored-token', user: loginResponse.user }),
    )

    renderWithAuth(<AuthStatus />)

    expect(await screen.findByText('ADMIN')).toBeInTheDocument()
  })

  it('redirects unauthenticated users to login', async () => {
    renderWithAuth(
      <Routes>
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<p>Dashboard privado</p>} />
        </Route>
        <Route path="/login" element={<p>Pantalla de login</p>} />
      </Routes>,
      ['/dashboard'],
    )

    expect(await screen.findByText('Pantalla de login')).toBeInTheDocument()
  })

  it('guards nested routes by role', async () => {
    sessionStorage.setItem(
      authSessionStorageKey,
      JSON.stringify({ accessToken: 'stored-token', user: { ...loginResponse.user, role: 'COACH' } }),
    )

    const view = renderWithAuth(
      <Routes>
        <Route element={<ProtectedRoute />}>
          <Route element={<RoleGuard roles={['ADMIN']} />}>
            <Route path="/admin" element={<p>Zona admin</p>} />
          </Route>
          <Route path="/dashboard" element={<p>Dashboard permitido</p>} />
        </Route>
        <Route path="/login" element={<p>Pantalla de login</p>} />
      </Routes>,
      ['/admin'],
    )

    expect(await screen.findByText('Dashboard permitido')).toBeInTheDocument()
    view.unmount()

    sessionStorage.setItem(
      authSessionStorageKey,
      JSON.stringify({ accessToken: 'stored-token', user: { ...loginResponse.user, role: 'ADMIN' } }),
    )

    renderWithAuth(
      <Routes>
        <Route element={<ProtectedRoute />}>
          <Route element={<RoleGuard roles={['ADMIN']} />}>
            <Route path="/admin" element={<p>Zona admin</p>} />
          </Route>
          <Route path="/dashboard" element={<p>Dashboard permitido</p>} />
        </Route>
        <Route path="/login" element={<p>Pantalla de login</p>} />
      </Routes>,
      ['/admin'],
    )

    expect(await screen.findByText('Zona admin')).toBeInTheDocument()
  })

  it('rejects an unsupported role from the API', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ ...loginResponse, user: { ...loginResponse.user, role: 'UNKNOWN' } }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    )

    renderWithAuth(<LoginPage />)

    fireEvent.change(screen.getByRole('textbox', { name: /correo electrónico/i }), { target: { value: 'user@example.com' } })
    fireEvent.change(screen.getByLabelText(/contraseña/i), { target: { value: 'secret' } })
    fireEvent.click(screen.getByRole('button', { name: 'Iniciar sesión' }))

    expect(await screen.findByText('El rol recibido por la API no está soportado.')).toBeInTheDocument()
  })
})
