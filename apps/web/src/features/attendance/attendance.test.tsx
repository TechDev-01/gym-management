import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AppProviders } from '../../app/providers'
import { getNavigationForRole } from '../../components/layout/navigation'
import type { UserRole } from '../../types/navigation'
import { canManageAttendance, canViewAttendance } from '../auth'
import { AttendancePage } from './pages/AttendancePage'
import type { AttendanceRecord } from './types'

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

const clients = [
  {
    id: 1,
    email: 'ana@example.com',
    dni: '12345678',
    name: 'Ana',
    lastName: 'Torres',
    phone: '555-1000',
    isActive: true,
    createdAt: '2026-01-15T10:00:00.000Z',
  },
  {
    id: 2,
    email: 'luis@example.com',
    dni: '87654321',
    name: 'Luis',
    lastName: 'Pérez',
    phone: '555-2000',
    isActive: false,
    createdAt: '2026-02-20T10:00:00.000Z',
  },
  {
    id: 3,
    email: 'carla@example.com',
    dni: '11223344',
    name: 'Carla',
    lastName: 'Ruiz',
    phone: '555-3000',
    isActive: true,
    createdAt: '2026-03-10T10:00:00.000Z',
  },
]

const memberships = [
  {
    id: 1,
    name: 'Plan Básico',
    description: 'Acceso a sala de pesas',
    durationDays: 30,
    maxDaysPerWeek: 3,
    priceAmount: 3500,
    currency: 'cop',
    isActive: true,
    stripePriceId: null,
  },
]

const subscriptions = [
  {
    id: 10,
    clientId: 1,
    membershipId: 1,
    status: 'ACTIVE',
    startDate: '2020-01-01',
    endDate: '2099-12-31',
    createdAt: '2020-01-01T00:00:00.000Z',
  },
]

const openRecord: AttendanceRecord = {
  id: 100,
  clientId: 1,
  subscriptionId: 10,
  checkInAt: '2026-10-28T08:00:00.000Z',
  checkOutAt: null,
  recordedById: 1,
}

const closedRecord: AttendanceRecord = {
  id: 99,
  clientId: 1,
  subscriptionId: 10,
  checkInAt: '2026-10-27T08:00:00.000Z',
  checkOutAt: '2026-10-27T09:30:00.000Z',
  recordedById: 1,
}

interface HandlerOptions {
  initialOpen?: boolean
  initialHistory?: AttendanceRecord[]
  historyTotal?: number
  checkInError?: string
}

function createHandler(options: HandlerOptions = {}) {
  let open: AttendanceRecord[] = options.initialOpen ? [openRecord] : []
  let history: AttendanceRecord[] = options.initialHistory ?? (options.initialOpen ? [openRecord] : [])
  let total = options.historyTotal ?? history.length

  return (url: string, init?: RequestInit): Response => {
    const method = init?.method ?? 'GET'

    if (url.includes('/attendance/check-in') && method === 'POST') {
      if (options.checkInError) {
        return json({ error: options.checkInError }, 409)
      }

      const record = { ...openRecord, id: 101 }
      open = [record]
      history = [record, ...history]
      total += 1
      return json(record, 201)
    }

    const checkOutMatch = url.match(/\/attendance\/(\d+)\/check-out/)
    if (checkOutMatch && method === 'POST') {
      const id = Number(checkOutMatch[1])
      const record = [...open, ...history].find((item) => item.id === id)

      if (!record) {
        return json({ error: 'Attendance not found' }, 404)
      }

      const closed = { ...record, checkOutAt: '2026-10-28T10:00:00.000Z' }
      open = open.filter((item) => item.id !== id)
      history = history.map((item) => (item.id === id ? closed : item))
      return json(closed)
    }

    if (url.includes('/attendance')) {
      const parsed = new URL(url)

      if (parsed.searchParams.get('open') === 'true') {
        return json({ items: open, page: 1, limit: 100, total: open.length })
      }

      const page = Number(parsed.searchParams.get('page') ?? '1')
      const limit = Number(parsed.searchParams.get('limit') ?? '20')
      const items = page === 1 ? history.slice(0, limit) : history

      return json({ items, page, limit, total })
    }

    if (url.endsWith('/clients')) {
      return json(clients)
    }

    if (url.includes('/subscriptions')) {
      const clientId = Number(new URL(url).searchParams.get('clientId'))
      return json(
        Number.isInteger(clientId)
          ? subscriptions.filter((subscription) => subscription.clientId === clientId)
          : subscriptions,
      )
    }

    if (/\/memberships\/\d+$/.test(url)) {
      return json(memberships[0])
    }

    if (url.includes('/memberships')) {
      return json(memberships)
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
        <AttendancePage />
      </MemoryRouter>
    </AppProviders>,
  )
}

describe('attendance module', () => {
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

  it('searches for a client and registers a check-in', async () => {
    const fetchMock = mockApi(createHandler())
    renderPage()

    const search = await screen.findByLabelText('Buscar cliente para registrar entrada')
    fireEvent.change(search, { target: { value: 'ana' } })

    expect(
      await screen.findByRole('button', { name: 'Seleccionar Ana Torres' }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Seleccionar Carla Ruiz' }),
    ).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Seleccionar Ana Torres' }))
    expect(await screen.findByText('Plan Básico')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Registrar entrada' }))

    await waitFor(() => {
      const call = fetchMock.mock.calls.find(
        ([input, init]) =>
          String(input).includes('/attendance/check-in') &&
          (init as RequestInit | undefined)?.method === 'POST',
      )
      expect(call).toBeDefined()
      expect(JSON.parse(String((call?.[1] as RequestInit).body))).toEqual({ clientId: 1 })
    })

    expect(await screen.findByText('Entrada registrada correctamente.')).toBeInTheDocument()
    expect(await screen.findByText(/Sesión abierta desde/i)).toBeInTheDocument()
  })

  it('explains why a client without a subscription cannot check in', async () => {
    const fetchMock = mockApi(createHandler())
    renderPage()

    const search = await screen.findByLabelText('Buscar cliente para registrar entrada')
    fireEvent.change(search, { target: { value: 'carla' } })
    fireEvent.click(await screen.findByRole('button', { name: 'Seleccionar Carla Ruiz' }))

    expect(
      await screen.findByText(/no tiene suscripciones registradas/i),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Registrar entrada' })).toBeDisabled()
    expect(fetchMock).not.toHaveBeenCalledWith(
      expect.stringContaining('/attendance/check-in'),
      expect.anything(),
    )
  })

  it('translates an API rejection for an expired membership', async () => {
    mockApi(createHandler({ checkInError: 'Client does not have an active subscription' }))
    renderPage()

    fireEvent.click(await screen.findByRole('button', { name: 'Seleccionar Ana Torres' }))
    expect(await screen.findByText('Plan Básico')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Registrar entrada' }))

    expect(
      await screen.findByText(/El cliente no tiene una membresía activa/i),
    ).toBeInTheDocument()
  })

  it('translates an API rejection for a duplicate open attendance', async () => {
    mockApi(createHandler({ checkInError: 'Client already has an open attendance' }))
    renderPage()

    fireEvent.click(await screen.findByRole('button', { name: 'Seleccionar Ana Torres' }))
    expect(await screen.findByText('Plan Básico')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Registrar entrada' }))

    expect(
      await screen.findByText(/ya tiene una entrada abierta/i),
    ).toBeInTheDocument()
  })

  it('closes an open attendance from the gym occupancy panel', async () => {
    const fetchMock = mockApi(createHandler({ initialOpen: true }))
    renderPage()

    expect(await screen.findByText('Dentro del gimnasio')).toBeInTheDocument()
    fireEvent.click(
      await screen.findByRole('button', { name: 'Registrar salida de Ana Torres' }),
    )

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/attendance/100/check-out'),
        expect.objectContaining({ method: 'POST' }),
      )
    })
    expect(await screen.findByText('Salida registrada correctamente.')).toBeInTheDocument()
    expect(
      await screen.findByText('No hay asistencias abiertas en este momento.'),
    ).toBeInTheDocument()
    expect(await screen.findByText('Cerrada')).toBeInTheDocument()
  })

  it('applies date filters and paginates the history', async () => {
    const fetchMock = mockApi(
      createHandler({ initialHistory: [closedRecord], historyTotal: 45 }),
    )
    renderPage()

    expect(await screen.findByText('Página 1 de 3')).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Desde'), { target: { value: '2026-09-01' } })
    fireEvent.change(screen.getByLabelText('Hasta'), { target: { value: '2026-09-30' } })

    await waitFor(() => {
      expect(
        fetchMock.mock.calls.some(([input]) => {
          const url = String(input)
          return url.includes('from=2026-09-01') && url.includes('to=2026-09-30')
        }),
      ).toBe(true)
    })

    fireEvent.click(await screen.findByRole('button', { name: 'Siguiente' }))

    await waitFor(() => {
      expect(
        fetchMock.mock.calls.some(([input]) => String(input).includes('page=2')),
      ).toBe(true)
    })
  })

  it('lets clients check in for themselves without loading the client directory', async () => {
    authState.user.role = 'CLIENT'
    authState.user.clientId = 1
    const fetchMock = mockApi(createHandler())
    renderPage()

    expect(
      screen.queryByLabelText('Buscar cliente para registrar entrada'),
    ).not.toBeInTheDocument()
    expect(screen.queryByText('Dentro del gimnasio')).not.toBeInTheDocument()
    expect(await screen.findByText('Plan Básico')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Registrar entrada' }))

    await waitFor(() => {
      const call = fetchMock.mock.calls.find(
        ([input, init]) =>
          String(input).includes('/attendance/check-in') &&
          (init as RequestInit | undefined)?.method === 'POST',
      )
      expect(call).toBeDefined()
      expect((call?.[1] as RequestInit).body).toBeUndefined()
    })
    expect(await screen.findByText('Entrada registrada correctamente.')).toBeInTheDocument()
    expect(
      fetchMock.mock.calls.some(([input]) => String(input).includes('/clients')),
    ).toBe(false)
  })

  it('keeps attendance out of the coach navigation and permissions', () => {
    expect(canViewAttendance('COACH')).toBe(false)
    expect(canViewAttendance('CLIENT')).toBe(true)
    expect(canManageAttendance('CLIENT')).toBe(false)

    const coachItems = getNavigationForRole('COACH').flatMap((section) => section.items)
    expect(coachItems.some((item) => item.href === '/attendance')).toBe(false)

    const receptionItems = getNavigationForRole('RECEPTION').flatMap((section) => section.items)
    expect(receptionItems.some((item) => item.href === '/attendance')).toBe(true)
  })
})
