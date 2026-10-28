import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AppProviders } from '../../app/providers'
import { getNavigationForRole } from '../../components/layout/navigation'
import type { UserRole } from '../../types/navigation'
import { canManageProgress, canViewProgress } from '../auth'
import { ProgressPage } from './pages/ProgressPage'
import type { ProgressRecord } from './types'

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

const client = {
  id: 1,
  email: 'ana@example.com',
  dni: '12345678',
  name: 'Ana',
  lastName: 'Torres',
  phone: '555-1000',
  isActive: true,
  createdAt: '2026-01-15T10:00:00.000Z',
}

function record(overrides: Partial<ProgressRecord> = {}): ProgressRecord {
  return {
    id: 1,
    clientId: 1,
    recordedById: 3,
    measuredAt: '2026-10-01',
    weightKg: 80,
    heightCm: 170,
    bodyFatPct: 23,
    muscleKg: 32,
    chestCm: 95,
    waistCm: 88,
    hipCm: 98,
    armCm: 32,
    thighCm: 55,
    notes: null,
    ...overrides,
  }
}

function createHandler() {
  let records = [
    record({ id: 1, measuredAt: '2026-10-01', weightKg: 80, waistCm: 88 }),
    record({ id: 2, measuredAt: '2026-09-01', weightKg: 82, waistCm: 90 }),
  ]

  return (url: string, init?: RequestInit): Response => {
    const method = init?.method ?? 'GET'

    if (url.includes('/progress') && method === 'POST') {
      const body = JSON.parse(String(init?.body)) as Record<string, unknown>
      const created = record({
        id: 3,
        clientId: typeof body.clientId === 'number' ? body.clientId : 1,
        measuredAt: String(body.measuredAt),
        weightKg: typeof body.weightKg === 'number' ? body.weightKg : null,
      })
      records = [created, ...records]
      return json(created, 201)
    }

    if (url.includes('/progress')) {
      return json({ items: records, page: 1, limit: 10, total: records.length })
    }

    if (url.endsWith('/clients')) {
      return json([client])
    }

    return json({ error: 'not found' }, 404)
  }
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function mockApi(handler: (url: string, init?: RequestInit) => Response | Promise<Response>) {
  const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) =>
    Promise.resolve(handler(String(input), init)),
  )
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

function renderPage() {
  return render(
    <AppProviders>
      <MemoryRouter>
        <ProgressPage />
      </MemoryRouter>
    </AppProviders>,
  )
}

describe('progress module', () => {
  beforeEach(() => {
    authState.user = {
      id: 'user-1',
      email: 'admin@example.com',
      role: 'ADMIN',
      clientId: null,
      coachId: null,
    }
  })

  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
  })

  it('loads a client history, renders the evolution chart and registers a measurement', async () => {
    const fetchMock = mockApi(createHandler())
    renderPage()

    expect(
      await screen.findByText('Selecciona un cliente para registrar y consultar su progreso.'),
    ).toBeInTheDocument()
    fireEvent.click(await screen.findByRole('button', { name: 'Seleccionar Ana Torres' }))

    expect(await screen.findByRole('img', { name: 'Evolución de Peso' })).toBeInTheDocument()
    expect(await screen.findByText('80 kg')).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Peso (kg)'), { target: { value: '78.5' } })
    fireEvent.click(screen.getByRole('button', { name: 'Registrar medición' }))

    await waitFor(() => {
      const call = fetchMock.mock.calls.find(
        ([input, init]) =>
          String(input).includes('/progress') &&
          (init as RequestInit | undefined)?.method === 'POST',
      )
      expect(call).toBeDefined()
      const body = JSON.parse(String((call?.[1] as RequestInit).body)) as Record<string, unknown>
      expect(body.clientId).toBe(1)
      expect(body.weightKg).toBe(78.5)
    })
    expect(await screen.findByText('Medición registrada correctamente.')).toBeInTheDocument()
  })

  it('requires at least one measurement before submitting', async () => {
    const fetchMock = mockApi(createHandler())
    renderPage()

    fireEvent.click(await screen.findByRole('button', { name: 'Seleccionar Ana Torres' }))
    expect(await screen.findByRole('img', { name: 'Evolución de Peso' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Registrar medición' }))

    expect(await screen.findByText('Registra al menos una medición.')).toBeInTheDocument()
    expect(
      fetchMock.mock.calls.some(([, init]) => init?.method === 'POST'),
    ).toBe(false)
  })

  it('lets clients register their own progress without a client selector', async () => {
    authState.user.role = 'CLIENT'
    authState.user.clientId = 1
    const fetchMock = mockApi(createHandler())
    renderPage()

    expect(await screen.findByText('Mi progreso')).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Seleccionar Ana Torres' }),
    ).not.toBeInTheDocument()
    expect(await screen.findByRole('img', { name: 'Evolución de Peso' })).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Peso (kg)'), { target: { value: '79' } })
    fireEvent.click(screen.getByRole('button', { name: 'Registrar medición' }))

    await waitFor(() => {
      const call = fetchMock.mock.calls.find(
        ([input, init]) =>
          String(input).includes('/progress') &&
          (init as RequestInit | undefined)?.method === 'POST',
      )
      expect(call).toBeDefined()
      const body = JSON.parse(String((call?.[1] as RequestInit).body)) as Record<string, unknown>
      expect(body.clientId).toBeUndefined()
      expect(body.weightKg).toBe(79)
    })
    expect(await screen.findByText('Medición registrada correctamente.')).toBeInTheDocument()
  })

  it('exposes progress to the expected roles in navigation and permissions', () => {
    expect(canViewProgress('ADMIN')).toBe(true)
    expect(canViewProgress('COACH')).toBe(true)
    expect(canViewProgress('CLIENT')).toBe(true)
    expect(canViewProgress('RECEPTION')).toBe(false)
    expect(canManageProgress('CLIENT')).toBe(true)
    expect(canManageProgress('RECEPTION')).toBe(false)

    const clientItems = getNavigationForRole('CLIENT').flatMap((section) => section.items)
    expect(clientItems.some((item) => item.href === '/progress')).toBe(true)

    const receptionItems = getNavigationForRole('RECEPTION').flatMap((section) => section.items)
    expect(receptionItems.some((item) => item.href === '/progress')).toBe(false)
  })
})
