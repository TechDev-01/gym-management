import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AppProviders } from '../../app/providers'
import type { UserRole } from '../../types/navigation'
import { ClientDetailPage } from './pages/ClientDetailPage'
import { ClientFormPage } from './pages/ClientFormPage'
import { ClientsPage } from './pages/ClientsPage'

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
]

const subscriptions = [
  {
    id: 10,
    clientId: 1,
    membershipId: 2,
    status: 'ACTIVE',
    startDate: '2026-10-01',
    endDate: '2026-11-01',
    createdAt: '2026-10-01T00:00:00.000Z',
  },
]

const attendancePage = {
  items: [
    {
      id: 1,
      clientId: 1,
      subscriptionId: 10,
      checkInAt: '2026-10-27T10:00:00.000Z',
      checkOutAt: '2026-10-27T11:00:00.000Z',
      recordedById: null,
    },
  ],
  page: 1,
  limit: 5,
  total: 1,
}

const progressPage = {
  items: [
    {
      id: 1,
      clientId: 1,
      recordedById: 1,
      measuredAt: '2026-10-20',
      weightKg: 72.5,
      heightCm: 175,
      bodyFatPct: 18.2,
      muscleKg: null,
      chestCm: null,
      waistCm: 80,
      hipCm: null,
      armCm: null,
      thighCm: null,
      notes: 'Buen avance',
    },
  ],
  page: 1,
  limit: 5,
  total: 1,
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function mockApi(
  handler: (url: string, init?: RequestInit) => Response | Promise<Response>,
) {
  const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) =>
    Promise.resolve(handler(String(input), init)),
  )
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

function clientsHandler(url: string, init?: RequestInit): Response {
  if (url.includes('/subscriptions')) {
    return json(subscriptions)
  }

  if (url.includes('/attendance')) {
    return json(attendancePage)
  }

  if (url.includes('/progress')) {
    return json(progressPage)
  }

  if (/\/clients\/\d+$/.test(url)) {
    return json(clients[0])
  }

  if (url.endsWith('/clients') && init?.method === 'POST') {
    return json({ ...clients[0], id: 3, email: 'nuevo@example.com' }, 201)
  }

  if (url.endsWith('/clients')) {
    return json(clients)
  }

  return json({ error: 'not found' }, 404)
}

function renderClientsPage(role: UserRole = 'ADMIN') {
  authState.user.role = role

  return render(
    <AppProviders>
      <MemoryRouter>
        <ClientsPage />
      </MemoryRouter>
    </AppProviders>,
  )
}

function renderClientDetail(role: UserRole = 'ADMIN') {
  authState.user.role = role

  return render(
    <AppProviders>
      <MemoryRouter initialEntries={['/clients/1']}>
        <Routes>
          <Route path="/clients/:id" element={<ClientDetailPage />} />
        </Routes>
      </MemoryRouter>
    </AppProviders>,
  )
}

function renderClientForm() {
  authState.user.role = 'ADMIN'

  return render(
    <AppProviders>
      <MemoryRouter initialEntries={['/clients/new']}>
        <Routes>
          <Route path="/clients/new" element={<ClientFormPage />} />
          <Route path="/clients/:id" element={<p>Detalle del cliente</p>} />
        </Routes>
      </MemoryRouter>
    </AppProviders>,
  )
}

function fillClientForm() {
  fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: 'Nuevo' } })
  fireEvent.change(screen.getByLabelText('Apellido'), { target: { value: 'Cliente' } })
  fireEvent.change(screen.getByLabelText('DNI'), { target: { value: '11223344' } })
  fireEvent.change(screen.getByLabelText('Teléfono'), { target: { value: '555-3000' } })
  fireEvent.change(screen.getByLabelText('Correo electrónico'), {
    target: { value: 'nuevo@example.com' },
  })
}

describe('clients module', () => {
  beforeEach(() => {
    authState.user.role = 'ADMIN'
  })

  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
  })

  it('lists clients, searches and filters by status', async () => {
    mockApi(clientsHandler)
    renderClientsPage()

    expect(await screen.findByText('Ana Torres')).toBeInTheDocument()
    expect(screen.getByText('Luis Pérez')).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Buscar clientes'), {
      target: { value: 'luis' },
    })

    expect(screen.queryByText('Ana Torres')).not.toBeInTheDocument()
    expect(screen.getByText('Luis Pérez')).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Buscar clientes'), { target: { value: '' } })
    fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Estado' }))
    fireEvent.click(screen.getByRole('option', { name: 'Inactivos' }))

    expect(screen.queryByText('Ana Torres')).not.toBeInTheDocument()
    expect(screen.getByText('Luis Pérez')).toBeInTheDocument()
  })

  it('shows management actions to administrators and hides them from coaches', async () => {
    mockApi(clientsHandler)
    const view = renderClientsPage('ADMIN')

    expect(await screen.findByText('Ana Torres')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Nuevo cliente' })).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: 'Editar' })).toHaveLength(2)

    view.unmount()
    mockApi(clientsHandler)
    renderClientsPage('COACH')

    expect(await screen.findByText('Ana Torres')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Nuevo cliente' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Editar' })).not.toBeInTheDocument()
  })

  it('validates the client form before submitting', async () => {
    const fetchMock = mockApi(clientsHandler)
    renderClientForm()

    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))

    expect(await screen.findByText('El nombre es obligatorio.')).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('creates a client without sending an empty password', async () => {
    const fetchMock = mockApi(clientsHandler)
    renderClientForm()
    fillClientForm()

    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Crear cliente' }))

    expect(await screen.findByText('Detalle del cliente')).toBeInTheDocument()

    const postCall = fetchMock.mock.calls.find(
      ([input, init]) =>
        String(input).endsWith('/clients') && (init as RequestInit | undefined)?.method === 'POST',
    )

    expect(postCall).toBeDefined()
    const body = JSON.parse(String((postCall?.[1] as RequestInit).body)) as Record<string, unknown>
    expect(body).toMatchObject({
      email: 'nuevo@example.com',
      dni: '11223344',
      name: 'Nuevo',
      lastName: 'Cliente',
      phone: '555-3000',
    })
    expect(body).not.toHaveProperty('password')
  })

  it('maps a duplicate email conflict to the email field', async () => {
    mockApi((url, init) => {
      if (url.endsWith('/clients') && init?.method === 'POST') {
        return json({ error: 'Email is already registered' }, 409)
      }

      return clientsHandler(url, init)
    })
    renderClientForm()
    fillClientForm()

    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Crear cliente' }))

    expect(await screen.findByText('Este correo ya está registrado.')).toBeInTheDocument()
  })

  it('shows the operational summary in the client detail', async () => {
    mockApi(clientsHandler)
    renderClientDetail()

    expect(await screen.findByRole('heading', { name: 'Ana Torres' })).toBeInTheDocument()
    expect(await screen.findByText('Membresía #2')).toBeInTheDocument()
    expect(await screen.findByText('Cerrada')).toBeInTheDocument()
    expect(await screen.findByText('Buen avance')).toBeInTheDocument()
  })

  it('limits the coach summary to progress data', async () => {
    const fetchMock = mockApi(clientsHandler)
    renderClientDetail('COACH')

    expect(await screen.findByText('Buen avance')).toBeInTheDocument()
    expect(
      screen.getByText(/La membresía y la asistencia están disponibles/i),
    ).toBeInTheDocument()

    await waitFor(() => {
      expect(fetchMock).not.toHaveBeenCalledWith(
        expect.stringContaining('/subscriptions'),
        expect.anything(),
      )
      expect(fetchMock).not.toHaveBeenCalledWith(
        expect.stringContaining('/attendance'),
        expect.anything(),
      )
    })
  })
})
