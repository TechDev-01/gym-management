import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import type { ReactNode } from 'react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AppProviders } from '../../app/providers'
import { getNavigationForRole } from '../../components/layout/navigation'
import type { UserRole } from '../../types/navigation'
import { canManageRoutines, canViewRoutines } from '../auth'
import { AssignmentsPage } from './pages/AssignmentsPage'
import { RoutineFormPage } from './pages/RoutineFormPage'
import { RoutinesPage } from './pages/RoutinesPage'
import type { ClientRoutine, Routine } from './types'

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

const coach = {
  id: 3,
  email: 'coach@example.com',
  dni: '30000000',
  name: 'Carla',
  lastName: 'Méndez',
  phone: '555-3000',
  isActive: true,
}

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

const exercise = {
  id: 1,
  name: 'Sentadilla con barra',
  muscleGroup: 'LEGS' as const,
  equipment: 'Barra',
  description: null,
}

function createRoutine(ownerId = coach.id): Routine {
  return {
    id: 1,
    name: 'Fuerza inicial',
    description: 'Rutina de adaptación',
    level: 'BEGINNER',
    createdById: ownerId,
    isActive: true,
    createdAt: '2026-10-01T10:00:00.000Z',
    creator: { ...coach, id: ownerId },
    exercises: [
      {
        id: 5,
        routineId: 1,
        exerciseId: 1,
        dayNumber: 1,
        position: 1,
        sets: 3,
        reps: 10,
        weightKg: '40.00',
        restSeconds: 90,
        notes: null,
        exercise,
      },
    ],
  }
}

function createAssignment(status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED' = 'ACTIVE'): ClientRoutine {
  return {
    id: 10,
    clientId: 1,
    routineId: 1,
    assignedById: 3,
    status,
    startDate: '2026-10-01',
    endDate: null,
    notes: null,
    client,
    routine: createRoutine(),
    assignedBy: coach,
  }
}

interface HandlerOptions {
  routineOwnerId?: number
}

function createHandler(options: HandlerOptions = {}) {
  let assignments = [createAssignment()]
  const routine = createRoutine(options.routineOwnerId)

  return (url: string, init?: RequestInit): Response => {
    const method = init?.method ?? 'GET'

    if (url.includes('/routines/assignments/10/status') && method === 'POST') {
      const body = JSON.parse(String(init?.body)) as { status: 'COMPLETED' | 'CANCELLED' }
      assignments = assignments.map((assignment) =>
        assignment.id === 10 ? { ...assignment, status: body.status } : assignment,
      )
      return json(assignments[0])
    }

    if (url.includes('/routines/assignments')) {
      return json(assignments)
    }

    if (url.includes('/routines/exercises')) {
      return json([exercise])
    }

    if (/\/routines\/\d+$/.test(url)) {
      return json(routine)
    }

    if (url.includes('/routines')) {
      return json([routine])
    }

    if (url.endsWith('/clients')) {
      return json([client])
    }

    if (url.endsWith('/coaches')) {
      return json([coach])
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

function renderWithRouter(element: ReactNode, path = '/routines') {
  return render(
    <AppProviders>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/routines" element={element} />
          <Route path="/routines/:id/edit" element={element} />
          <Route path="/routines/assignments" element={element} />
        </Routes>
      </MemoryRouter>
    </AppProviders>,
  )
}

describe('routines module', () => {
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

  it('lists routines for administrators and exposes management actions', async () => {
    mockApi(createHandler())
    renderWithRouter(<RoutinesPage />)

    expect(await screen.findByText('Fuerza inicial')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Nueva rutina' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ejercicios' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Asignaciones' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ver' })).toHaveAttribute('href', '/routines/1')
  })

  it('shows clients only their assigned routines without management actions', async () => {
    authState.user.role = 'CLIENT'
    authState.user.clientId = 1
    const fetchMock = mockApi(createHandler())

    renderWithRouter(<RoutinesPage />)

    expect(await screen.findByText('Mis rutinas')).toBeInTheDocument()
    expect(await screen.findByText('Fuerza inicial')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Nueva rutina' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Asignaciones' })).not.toBeInTheDocument()
    expect(
      fetchMock.mock.calls.some(([input]) => /\/routines\?/.test(String(input))),
    ).toBe(false)
  })

  it('validates required routine data before creating', async () => {
    const fetchMock = mockApi(createHandler())
    renderWithRouter(<RoutineFormPage />)

    fireEvent.click(await screen.findByRole('button', { name: 'Guardar' }))

    expect(await screen.findByText('El nombre es obligatorio.')).toBeInTheDocument()
    expect(
      fetchMock.mock.calls.some(([, init]) => init?.method === 'POST'),
    ).toBe(false)
  })

  it('prevents a coach from editing a routine owned by another coach', async () => {    authState.user.role = 'COACH'
    authState.user.coachId = 3
    mockApi(createHandler({ routineOwnerId: 9 }))

    renderWithRouter(<RoutineFormPage editing />, '/routines/1/edit')

    expect(
      await screen.findByText('Solo el entrenador responsable puede modificar esta rutina.'),
    ).toBeInTheDocument()
  })

  it('completes an active assignment after confirmation', async () => {
    const fetchMock = mockApi(createHandler())
    renderWithRouter(<AssignmentsPage />, '/routines/assignments')

    expect(await screen.findByText('Fuerza inicial')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Completar' }))

    const dialog = await screen.findByRole('dialog')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Completar' }))

    await waitFor(() => {
      const call = fetchMock.mock.calls.find(
        ([input, init]) =>
          String(input).includes('/routines/assignments/10/status') &&
          (init as RequestInit | undefined)?.method === 'POST',
      )
      expect(call).toBeDefined()
      expect(JSON.parse(String((call?.[1] as RequestInit).body))).toEqual({
        status: 'COMPLETED',
      })
    })
    expect(await screen.findByText('Asignación completada correctamente.')).toBeInTheDocument()
    expect(await screen.findByText('Completada')).toBeInTheDocument()
  })

  it('keeps routines available to the expected roles in navigation and permissions', () => {
    expect(canViewRoutines('ADMIN')).toBe(true)
    expect(canViewRoutines('COACH')).toBe(true)
    expect(canViewRoutines('CLIENT')).toBe(true)
    expect(canViewRoutines('RECEPTION')).toBe(false)
    expect(canManageRoutines('CLIENT')).toBe(false)
    expect(canManageRoutines('COACH')).toBe(true)

    const clientItems = getNavigationForRole('CLIENT').flatMap((section) => section.items)
    expect(clientItems.some((item) => item.href === '/routines')).toBe(true)

    const receptionItems = getNavigationForRole('RECEPTION').flatMap((section) => section.items)
    expect(receptionItems.some((item) => item.href === '/routines')).toBe(false)
  })
})
