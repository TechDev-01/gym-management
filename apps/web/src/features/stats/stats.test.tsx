import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AppProviders } from '../../app/providers'
import type { UserRole } from '../../types/navigation'
import { StatsPage } from './pages/StatsPage'

const authState = {
  user: {
    id: 'user-1',
    email: 'admin@example.com',
    role: 'ADMIN' as UserRole,
    clientId: null as number | null,
    coachId: null as number | null,
  },
}

vi.mock('../auth', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../auth')>()
  return { ...actual, useAuth: () => authState }
})

const statsResponse = {
  period: { from: '2026-09-28', to: '2026-10-28' },
  clients: { active: 1248 },
  memberships: { active: 1100, expired: 32 },
  revenue: { amount: 24680, currency: 'USD' },
  attendance: { total: 186 },
  payments: [
    { status: 'succeeded', count: 40, amount: 24680 },
    { status: 'pending', count: 3, amount: 900 },
  ],
  coachUsage: [{
    coachId: 1,
    coachName: 'Ana Torres',
    routinesCreated: 12,
    routineAssignments: 18,
    progressRecords: 9,
  }],
}

const completedStatus = {
  jobId: 'admin-report-1-1760000000000',
  reportType: 'dashboard-summary',
  status: 'completed',
  requestedAt: '2026-10-28T12:00:00.000Z',
  finishedAt: '2026-10-28T12:00:05.000Z',
  result: statsResponse,
  error: null,
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function renderStatsPage() {
  return render(
    <AppProviders>
      <MemoryRouter>
        <StatsPage />
      </MemoryRouter>
    </AppProviders>,
  )
}

function isDashboardCall(url: string, init?: RequestInit): boolean {
  return url.includes('/stats/dashboard') && (init?.method ?? 'GET') === 'GET'
}

describe('stats', () => {
  let reportStatus: unknown = completedStatus

  beforeEach(() => {
    authState.user.role = 'ADMIN'
    reportStatus = completedStatus
    vi.stubGlobal(
      'fetch',
      vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input)

        if (url.includes('/stats/reports/')) {
          return Promise.resolve(json(reportStatus))
        }

        if (url.endsWith('/stats/reports') && init?.method === 'POST') {
          return Promise.resolve(json({ jobId: completedStatus.jobId }, 202))
        }

        return Promise.resolve(json(statsResponse))
      }),
    )
  })

  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
  })

  it('loads administrative metrics, payments and coach segmentation', async () => {
    renderStatsPage()

    expect(await screen.findByText('1,248')).toBeInTheDocument()
    expect(screen.getByText('Ana Torres')).toBeInTheDocument()
    expect(screen.getByText('Completado')).toBeInTheDocument()
    expect(screen.getByText('Pendiente')).toBeInTheDocument()
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/stats/dashboard?'),
      expect.objectContaining({ headers: expect.any(Headers) }),
    )
  })

  it('lets reception access statistics', async () => {
    authState.user.role = 'RECEPTION'

    renderStatsPage()

    expect(await screen.findByText('1,248')).toBeInTheDocument()
  })

  it('updates the query when the period changes', async () => {
    renderStatsPage()

    await screen.findByText('1,248')
    const dashboardCalls = () =>
      (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls
        .filter(([url, init]) => isDashboardCall(String(url), init as RequestInit | undefined))
        .map(([url]) => String(url))
    const firstUrl = dashboardCalls()[0]

    fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Periodo' }))
    fireEvent.click(await screen.findByRole('option', { name: 'Últimos 7 días' }))

    await waitFor(() => expect(dashboardCalls().length).toBeGreaterThan(1))
    expect(dashboardCalls().at(-1)).not.toEqual(firstUrl)
  })

  it('blocks invalid custom ranges without inventing metrics', async () => {
    renderStatsPage()

    await screen.findByText('1,248')
    fireEvent.change(screen.getByLabelText('Desde'), { target: { value: '2026-10-30' } })
    fireEvent.change(screen.getByLabelText('Hasta'), { target: { value: '2026-10-01' } })

    expect(await screen.findByText(/rango válido/i)).toBeInTheDocument()
  })

  it('shows the API error instead of inventing metrics', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(json({ error: 'No fue posible consultar las métricas' }, 500))),
    )

    renderStatsPage()

    expect(
      await screen.findByText('No fue posible consultar las métricas', {}, { timeout: 3_000 }),
    ).toBeInTheDocument()
  })

  it('shows explicit empty states when the period has no activity', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        json({ ...statsResponse, payments: [], coachUsage: [] }),
      ),
    )

    renderStatsPage()

    expect(await screen.findByText('No hay pagos para este periodo.')).toBeInTheDocument()
    expect(
      screen.getByText('No hay actividad de entrenadores para este periodo.'),
    ).toBeInTheDocument()
  })

  it('requests a report and shows its completed summary', async () => {
    renderStatsPage()

    await screen.findByText('1,248')
    fireEvent.click(screen.getByRole('button', { name: 'Solicitar reporte' }))

    expect(await screen.findByText(completedStatus.jobId)).toBeInTheDocument()
    expect(await screen.findByText(/1,248 clientes.*186 asistencias/i)).toBeInTheDocument()
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/stats/reports'),
      expect.objectContaining({ method: 'POST' }),
    )
  })

  it('shows a pending report while the job is queued', async () => {
    reportStatus = {
      ...completedStatus,
      status: 'pending',
      finishedAt: null,
      result: null,
    }

    renderStatsPage()

    await screen.findByText('1,248')
    fireEvent.click(screen.getByRole('button', { name: 'Solicitar reporte' }))

    expect(await screen.findByText('En proceso...')).toBeInTheDocument()
  })

  it('shows the failure reason when a report fails', async () => {
    reportStatus = {
      ...completedStatus,
      status: 'failed',
      result: null,
      error: 'No se pudo generar el reporte',
    }

    renderStatsPage()

    await screen.findByText('1,248')
    fireEvent.click(screen.getByRole('button', { name: 'Solicitar reporte' }))

    expect(await screen.findByText('No se pudo generar el reporte')).toBeInTheDocument()
  })

  it('hides statistics from users without access', async () => {
    authState.user.role = 'COACH'

    renderStatsPage()

    expect(
      await screen.findByText(/estadísticas están disponibles para administración y recepción/i),
    ).toBeInTheDocument()
    expect(fetch).not.toHaveBeenCalled()
  })
})
