import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AppProviders } from '../../app/providers'
import { DashboardPage } from './pages/DashboardPage'
import type { UserRole } from '../../types/navigation'

const authState = {
  user: {
    id: 'user-1',
    email: 'admin@example.com',
    role: 'ADMIN' as UserRole,
    clientId: null,
    coachId: null,
  },
}

vi.mock('../auth', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../auth')>()
  return { ...actual, useAuth: () => authState }
})

const dashboardResponse = {
  period: { from: '2026-09-28', to: '2026-10-28' },
  clients: { active: 1248 },
  memberships: { active: 1100, expired: 32 },
  revenue: { amount: 24680, currency: 'USD' },
  attendance: { total: 186 },
  payments: [{ status: 'succeeded', count: 40, amount: 24680 }],
  coachUsage: [{
    coachId: 1,
    coachName: 'Ana Torres',
    routinesCreated: 12,
    routineAssignments: 18,
    progressRecords: 9,
  }],
}

function renderDashboard() {
  return render(
    <AppProviders>
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    </AppProviders>,
  )
}

describe('dashboard', () => {
  beforeEach(() => {
    authState.user.role = 'ADMIN'
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify(dashboardResponse), {
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

  it('loads dashboard statistics for staff roles', async () => {
    renderDashboard()

    expect(await screen.findByText('1,248')).toBeInTheDocument()
    expect(screen.getAllByText(/24,680/).length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('Ana Torres')).toBeInTheDocument()
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/stats/dashboard?'),
      expect.objectContaining({ headers: expect.any(Headers) }),
    )
  })

  it('shows an explicit unavailable state for client users', async () => {
    authState.user.role = 'CLIENT'

    renderDashboard()

    expect(await screen.findByText(/estadísticas del dashboard están disponibles/i)).toBeInTheDocument()
    expect(fetch).not.toHaveBeenCalled()
  })

  it('shows the API error without rendering invented metrics', async () => {
    vi.mocked(fetch).mockImplementation(() => Promise.resolve(
      new Response(JSON.stringify({ error: 'No fue posible cargar el dashboard.' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }),
    ))

    renderDashboard()

    expect(await screen.findByRole('alert', {}, { timeout: 3_000 })).toHaveTextContent(/error interno|No fue posible cargar el dashboard/i)
    expect(screen.queryByText('1,248')).not.toBeInTheDocument()
  })

  it('shows empty states for periods without activity', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ ...dashboardResponse, payments: [], coachUsage: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    )

    renderDashboard()

    expect(await screen.findByText('No hay pagos para este periodo.')).toBeInTheDocument()
    expect(screen.getByText('No hay actividad de entrenadores para este periodo.')).toBeInTheDocument()
  })
})
