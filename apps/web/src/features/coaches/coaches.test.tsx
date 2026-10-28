import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AppProviders } from '../../app/providers'
import type { UserRole } from '../../types/navigation'
import { CoachDetailPage } from './pages/CoachDetailPage'
import { CoachFormPage } from './pages/CoachFormPage'
import { CoachesPage } from './pages/CoachesPage'

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

const coaches = [
  {
    id: 1,
    email: 'carlos@example.com',
    dni: '11111111',
    name: 'Carlos',
    lastName: 'Ruiz',
    phone: '555-4000',
    isActive: true,
  },
  {
    id: 2,
    email: 'marta@example.com',
    dni: '22222222',
    name: 'Marta',
    lastName: 'Soto',
    phone: '555-5000',
    isActive: false,
  },
]

const schedules = [
  {
    id: 1,
    coachId: 1,
    dayOfWeek: 1,
    startTime: '08:00',
    endTime: '16:00',
  },
]

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

function coachesHandler(url: string, init?: RequestInit): Response {
  if (/\/coaches\/\d+\/schedules\/\d+$/.test(url)) {
    if (init?.method === 'PATCH') {
      return json({
        ...schedules[0],
        ...(JSON.parse(String(init.body)) as Record<string, unknown>),
      })
    }

    if (init?.method === 'DELETE') {
      return new Response(null, { status: 204 })
    }
  }

  if (/\/coaches\/\d+\/schedules$/.test(url)) {
    if (init?.method === 'POST') {
      return json(
        {
          ...schedules[0],
          id: 2,
          ...(JSON.parse(String(init.body)) as Record<string, unknown>),
        },
        201,
      )
    }

    return json(schedules)
  }

  if (/\/coaches\/\d+$/.test(url)) {
    return json(coaches[0])
  }

  if (url.endsWith('/coaches') && init?.method === 'POST') {
    return json({ ...coaches[0], id: 3, email: 'nuevo@example.com' }, 201)
  }

  if (url.endsWith('/coaches')) {
    return json(coaches)
  }

  return json({ error: 'not found' }, 404)
}

function renderCoachesPage(role: UserRole = 'ADMIN') {
  authState.user.role = role

  return render(
    <AppProviders>
      <MemoryRouter>
        <CoachesPage />
      </MemoryRouter>
    </AppProviders>,
  )
}

function renderCoachDetail(role: UserRole = 'ADMIN') {
  authState.user.role = role

  return render(
    <AppProviders>
      <MemoryRouter initialEntries={['/coaches/1']}>
        <Routes>
          <Route path="/coaches/:id" element={<CoachDetailPage />} />
        </Routes>
      </MemoryRouter>
    </AppProviders>,
  )
}

function renderCoachForm() {
  authState.user.role = 'ADMIN'

  return render(
    <AppProviders>
      <MemoryRouter initialEntries={['/coaches/new']}>
        <Routes>
          <Route path="/coaches/new" element={<CoachFormPage />} />
          <Route path="/coaches/:id" element={<p>Detalle del entrenador</p>} />
        </Routes>
      </MemoryRouter>
    </AppProviders>,
  )
}

function fillCoachForm() {
  fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: 'Nuevo' } })
  fireEvent.change(screen.getByLabelText('Apellido'), { target: { value: 'Entrenador' } })
  fireEvent.change(screen.getByLabelText('DNI'), { target: { value: '33333333' } })
  fireEvent.change(screen.getByLabelText('Teléfono'), { target: { value: '555-6000' } })
  fireEvent.change(screen.getByLabelText('Correo electrónico'), {
    target: { value: 'entrenador@example.com' },
  })
}

describe('coaches module', () => {
  beforeEach(() => {
    authState.user.role = 'ADMIN'
  })

  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
  })

  it('lists coaches, searches and filters by status', async () => {
    mockApi(coachesHandler)
    renderCoachesPage()

    expect(await screen.findByText('Carlos Ruiz')).toBeInTheDocument()
    expect(screen.getByText('Marta Soto')).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Buscar entrenadores'), {
      target: { value: 'marta' },
    })

    expect(screen.queryByText('Carlos Ruiz')).not.toBeInTheDocument()
    expect(screen.getByText('Marta Soto')).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Buscar entrenadores'), { target: { value: '' } })
    fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Estado' }))
    fireEvent.click(screen.getByRole('option', { name: 'Inactivos' }))

    expect(screen.queryByText('Carlos Ruiz')).not.toBeInTheDocument()
    expect(screen.getByText('Marta Soto')).toBeInTheDocument()
  })

  it('shows management actions to administrators and hides them from coaches', async () => {
    mockApi(coachesHandler)
    const view = renderCoachesPage('ADMIN')

    expect(await screen.findByText('Carlos Ruiz')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Nuevo entrenador' })).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: 'Editar' })).toHaveLength(2)

    view.unmount()
    mockApi(coachesHandler)
    renderCoachesPage('COACH')

    expect(await screen.findByText('Carlos Ruiz')).toBeInTheDocument()
    expect(
      screen.queryByRole('link', { name: 'Nuevo entrenador' }),
    ).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Editar' })).not.toBeInTheDocument()
  })

  it('validates the coach form before submitting', async () => {
    const fetchMock = mockApi(coachesHandler)
    renderCoachForm()

    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))

    expect(await screen.findByText('El nombre es obligatorio.')).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('creates a coach after confirmation', async () => {
    const fetchMock = mockApi(coachesHandler)
    renderCoachForm()
    fillCoachForm()

    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Crear entrenador' }))

    expect(await screen.findByText('Detalle del entrenador')).toBeInTheDocument()

    const postCall = fetchMock.mock.calls.find(
      ([input, init]) =>
        String(input).endsWith('/coaches') && (init as RequestInit | undefined)?.method === 'POST',
    )

    expect(postCall).toBeDefined()
    const body = JSON.parse(String((postCall?.[1] as RequestInit).body)) as Record<string, unknown>
    expect(body).toMatchObject({
      email: 'entrenador@example.com',
      dni: '33333333',
      name: 'Nuevo',
      lastName: 'Entrenador',
      phone: '555-6000',
    })
  })

  it('shows the coach detail with weekly schedules and the phase 9 placeholder', async () => {
    mockApi(coachesHandler)
    renderCoachDetail()

    expect(await screen.findByRole('heading', { name: 'Carlos Ruiz' })).toBeInTheDocument()
    expect(await screen.findByText('Lunes')).toBeInTheDocument()
    expect(screen.getByText('08:00')).toBeInTheDocument()
    expect(screen.getByText('16:00')).toBeInTheDocument()
    expect(screen.getByText(/se incorporarán en la Fase 9/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Agregar horario' })).toBeInTheDocument()
  })

  it('shows schedules as read only for coaches', async () => {
    mockApi(coachesHandler)
    renderCoachDetail('COACH')

    expect(await screen.findByText('Lunes')).toBeInTheDocument()
    expect(screen.getByText('Solo lectura')).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Agregar horario' }),
    ).not.toBeInTheDocument()
  })

  it('adds a schedule from the coach detail', async () => {
    const fetchMock = mockApi(coachesHandler)
    renderCoachDetail()

    fireEvent.click(await screen.findByRole('button', { name: 'Agregar horario' }))
    fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Día' }))
    fireEvent.click(screen.getByRole('option', { name: 'Martes' }))
    fireEvent.click(screen.getByRole('button', { name: 'Guardar horario' }))

    expect(
      await screen.findByText('Horario agregado correctamente.'),
    ).toBeInTheDocument()

    const postCall = fetchMock.mock.calls.find(
      ([input, init]) =>
        String(input).endsWith('/coaches/1/schedules') &&
        (init as RequestInit | undefined)?.method === 'POST',
    )

    expect(postCall).toBeDefined()
    const body = JSON.parse(String((postCall?.[1] as RequestInit).body)) as Record<
      string,
      unknown
    >
    expect(body).toMatchObject({
      dayOfWeek: 2,
      startTime: '08:00',
      endTime: '16:00',
    })
  })

  it('deletes a schedule after confirmation', async () => {
    const fetchMock = mockApi(coachesHandler)
    renderCoachDetail()

    fireEvent.click(
      await screen.findByRole('button', {
        name: 'Eliminar horario del Lunes',
      }),
    )
    fireEvent.click(
      await screen.findByRole('button', { name: 'Eliminar horario' }),
    )

    expect(
      await screen.findByText('Horario eliminado correctamente.'),
    ).toBeInTheDocument()
    expect(
      fetchMock.mock.calls.some(
        ([input, init]) =>
          String(input).endsWith('/coaches/1/schedules/1') &&
          (init as RequestInit | undefined)?.method === 'DELETE',
      ),
    ).toBe(true)
  })
})
