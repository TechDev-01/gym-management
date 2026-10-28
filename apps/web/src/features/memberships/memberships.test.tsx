import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AppProviders } from '../../app/providers'
import type { UserRole } from '../../types/navigation'
import { MembershipFormPage } from './pages/MembershipFormPage'
import { MembershipsPage } from './pages/MembershipsPage'
import { SubscriptionDetailPage } from './pages/SubscriptionDetailPage'
import { SubscriptionFormPage } from './pages/SubscriptionFormPage'
import { SubscriptionsPage } from './pages/SubscriptionsPage'

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
  {
    id: 2,
    name: 'Plan Premium',
    description: null,
    durationDays: 90,
    maxDaysPerWeek: null,
    priceAmount: 9000,
    currency: 'cop',
    isActive: false,
    stripePriceId: null,
  },
]

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
    isActive: true,
    createdAt: '2026-02-20T10:00:00.000Z',
  },
]

const subscriptions = [
  {
    id: 10,
    clientId: 1,
    membershipId: 1,
    status: 'ACTIVE',
    startDate: '2026-10-01',
    endDate: '2026-10-30',
    createdAt: '2026-10-01T00:00:00.000Z',
  },
  {
    id: 11,
    clientId: 2,
    membershipId: 2,
    status: 'PENDING',
    startDate: null,
    endDate: null,
    createdAt: '2026-10-20T00:00:00.000Z',
  },
]

const payments = [
  {
    id: 20,
    clientId: 1,
    subscriptionId: 10,
    method: 'CASH',
    status: 'SUCCEEDED',
    amount: 3500,
    currency: 'cop',
    refundedAmount: 0,
    receiptUrl: null,
    recordedById: 1,
    paidAt: '2026-10-01T10:00:00.000Z',
    createdAt: '2026-10-01T10:00:00.000Z',
  },
]

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

function defaultHandler(url: string, init?: RequestInit): Response {
  if (url.includes('/memberships/1/subscriptions')) {
    return json({ ...subscriptions[0], id: 12, status: 'PENDING', checkoutUrl: null }, 201)
  }

  if (url.includes('/memberships/1/status')) {
    return json({ ...memberships[0], isActive: false })
  }

  if (/\/memberships\/\d+$/.test(url)) {
    const id = Number(url.split('/').pop())
    return json(memberships.find((membership) => membership.id === id) ?? memberships[0])
  }

  if (url.includes('/memberships')) {
    return json(memberships)
  }

  if (url.includes('/subscriptions/10/cancel')) {
    return json({ ...subscriptions[0], status: 'CANCELLED' })
  }

  if (url.includes('/subscriptions/11/payment-confirmation')) {
    return json({ ...subscriptions[1], status: 'ACTIVE' })
  }

  if (/\/subscriptions\/\d+$/.test(url)) {
    const id = Number(url.split('/').pop())
    return json(subscriptions.find((subscription) => subscription.id === id) ?? subscriptions[0])
  }

  if (url.includes('/subscriptions')) {
    return json(subscriptions)
  }

  if (url.includes('/payments')) {
    return json(payments)
  }

  if (url.endsWith('/clients')) {
    return json(clients)
  }

  return json({ error: 'not found' }, 404)
}

function renderPage(
  ui: React.ReactNode,
  initialEntries: string[] = ['/'],
  routes?: React.ReactNode,
) {
  return render(
    <AppProviders>
      <MemoryRouter initialEntries={initialEntries}>
        {routes ?? ui}
      </MemoryRouter>
    </AppProviders>,
  )
}

describe('memberships module', () => {
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

  it('lists memberships, searches and filters by status', async () => {
    mockApi(defaultHandler)
    renderPage(<MembershipsPage />)

    expect(await screen.findByText('Plan Básico')).toBeInTheDocument()
    expect(screen.getByText('Plan Premium')).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Buscar membresías'), {
      target: { value: 'premium' },
    })

    expect(screen.queryByText('Plan Básico')).not.toBeInTheDocument()
    expect(screen.getByText('Plan Premium')).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Buscar membresías'), { target: { value: '' } })
    fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Estado' }))
    fireEvent.click(screen.getByRole('option', { name: 'Inactivos' }))

    expect(screen.queryByText('Plan Básico')).not.toBeInTheDocument()
    expect(screen.getByText('Plan Premium')).toBeInTheDocument()
  })

  it('shows management actions only to allowed roles', async () => {
    mockApi(defaultHandler)
    const view = renderPage(<MembershipsPage />)

    expect(await screen.findByText('Plan Básico')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Nueva membresía' })).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: 'Editar' })).toHaveLength(2)
    expect(screen.getByRole('button', { name: 'Desactivar' })).toBeInTheDocument()

    view.unmount()
    authState.user.role = 'CLIENT'
    authState.user.clientId = 1
    mockApi(defaultHandler)
    renderPage(<MembershipsPage />)

    expect(await screen.findByText('Plan Básico')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Nueva membresía' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Editar' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Desactivar' })).not.toBeInTheDocument()
  })

  it('requires confirmation before deactivating a membership', async () => {
    const fetchMock = mockApi(defaultHandler)
    renderPage(<MembershipsPage />)

    expect(await screen.findByText('Plan Básico')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Desactivar' }))

    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByText(/dejará de estar disponible/i)).toBeInTheDocument()
    fireEvent.click(within(dialog).getByRole('button', { name: 'Desactivar' }))

    await waitFor(() => {
      const call = fetchMock.mock.calls.find(
        ([input, init]) =>
          String(input).includes('/memberships/1/status') &&
          (init as RequestInit | undefined)?.method === 'PATCH',
      )
      expect(call).toBeDefined()
      expect(JSON.parse(String((call?.[1] as RequestInit).body))).toEqual({ isActive: false })
    })
  })

  it('validates the membership form before submitting', async () => {
    const fetchMock = mockApi(defaultHandler)
    renderPage(<MembershipFormPage />)

    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))

    expect(await screen.findByText('El nombre es obligatorio.')).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('creates a membership with a whole-unit price', async () => {
    const fetchMock = mockApi(defaultHandler)
    renderPage(<MembershipFormPage />)

    fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: 'Plan Nuevo' } })
    fireEvent.change(screen.getByLabelText('Duración en días'), { target: { value: '45' } })
    fireEvent.change(screen.getByLabelText('Precio'), { target: { value: '3500' } })
    fireEvent.change(screen.getByLabelText('Moneda'), { target: { value: 'COP' } })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))

    const dialog = await screen.findByRole('dialog')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Crear membresía' }))

    await waitFor(() => {
      const call = fetchMock.mock.calls.find(
        ([input, init]) =>
          String(input).endsWith('/memberships') &&
          (init as RequestInit | undefined)?.method === 'POST',
      )
      expect(call).toBeDefined()
      expect(JSON.parse(String((call?.[1] as RequestInit).body))).toMatchObject({
        name: 'Plan Nuevo',
        durationDays: 45,
        maxDaysPerWeek: null,
        priceAmount: 3500,
        currency: 'cop',
        stripePriceId: null,
      })
    })
  })

  it('only sends changed fields when editing a membership', async () => {
    const fetchMock = mockApi((url, init) => {
      if (url.endsWith('/memberships/1') && init?.method === 'PATCH') {
        return json({ ...memberships[0], name: 'Plan Renombrado' })
      }
      return defaultHandler(url, init)
    })
    renderPage(
      <MembershipFormPage editing />,
      ['/memberships/1/edit'],
      <Routes>
        <Route path="/memberships/:id/edit" element={<MembershipFormPage editing />} />
        <Route path="/memberships" element={<p>Catálogo de membresías</p>} />
      </Routes>,
    )

    const nameInput = await screen.findByLabelText('Nombre')
    await waitFor(() => {
      expect(nameInput).toHaveValue('Plan Básico')
    })
    fireEvent.change(nameInput, { target: { value: 'Plan Renombrado' } })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))

    expect(await screen.findByText('Catálogo de membresías')).toBeInTheDocument()

    const call = fetchMock.mock.calls.find(
      ([input, init]) =>
        String(input).endsWith('/memberships/1') &&
        (init as RequestInit | undefined)?.method === 'PATCH',
    )
    expect(call).toBeDefined()
    expect(JSON.parse(String((call?.[1] as RequestInit).body))).toEqual({
      name: 'Plan Renombrado',
    })
  })

  it('lists subscriptions and filters from the API by status', async () => {
    const fetchMock = mockApi((url, init) => {
      if (url.includes('status=PENDING')) {
        return json([subscriptions[1]])
      }
      return defaultHandler(url, init)
    })
    renderPage(<SubscriptionsPage />)

    expect(await screen.findByText('Ana Torres')).toBeInTheDocument()
    expect(screen.getByText('Luis Pérez')).toBeInTheDocument()

    fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Estado de suscripción' }))
    fireEvent.click(screen.getByRole('option', { name: 'Pendientes' }))

    expect(await screen.findByText('Luis Pérez')).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.queryByText('Ana Torres')).not.toBeInTheDocument()
    })
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('subscriptions?status=PENDING'),
      expect.anything(),
    )
  })

  it('does not request the client directory when the user is a client', async () => {
    authState.user.role = 'CLIENT'
    authState.user.clientId = 1
    const fetchMock = mockApi(defaultHandler)
    renderPage(<SubscriptionsPage />)

    expect(await screen.findByText('Plan Básico')).toBeInTheDocument()

    await waitFor(() => {
      expect(fetchMock).not.toHaveBeenCalledWith(
        expect.stringContaining('/clients'),
        expect.anything(),
      )
    })
  })

  it('creates a subscription and sends the selected client, membership and method', async () => {
    const fetchMock = mockApi(defaultHandler)
    renderPage(
      <SubscriptionFormPage />,
      ['/subscriptions/new'],
      <Routes>
        <Route path="/subscriptions/new" element={<SubscriptionFormPage />} />
        <Route path="/subscriptions/:id" element={<p>Detalle de suscripción</p>} />
      </Routes>,
    )

    fireEvent.mouseDown(await screen.findByRole('combobox', { name: 'Cliente' }))
    fireEvent.click(await screen.findByRole('option', { name: /Ana Torres/i }))
    fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Membresía' }))
    fireEvent.click(screen.getByRole('option', { name: /Plan Básico/i }))
    fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Método de pago' }))
    fireEvent.click(screen.getByRole('option', { name: 'Efectivo' }))

    fireEvent.click(screen.getByRole('button', { name: 'Crear suscripción' }))

    const dialog = await screen.findByRole('dialog')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Crear suscripción' }))

    expect(await screen.findByText('Detalle de suscripción')).toBeInTheDocument()

    const call = fetchMock.mock.calls.find(
      ([input, init]) =>
        String(input).includes('/memberships/1/subscriptions') &&
        (init as RequestInit | undefined)?.method === 'POST',
    )
    expect(call).toBeDefined()
    expect(JSON.parse(String((call?.[1] as RequestInit).body))).toEqual({
      clientId: 1,
      membershipId: 1,
      method: 'CASH',
    })
  })

  it('uses the authenticated client id and hides the client selector for clients', async () => {
    authState.user.role = 'CLIENT'
    authState.user.clientId = 1
    const fetchMock = mockApi(defaultHandler)
    renderPage(
      <SubscriptionFormPage />,
      ['/subscriptions/new'],
      <Routes>
        <Route path="/subscriptions/new" element={<SubscriptionFormPage />} />
        <Route path="/subscriptions/:id" element={<p>Detalle de suscripción</p>} />
      </Routes>,
    )

    await waitFor(() => {
      expect(screen.queryByText('Cargando membresías...')).not.toBeInTheDocument()
    })
    expect(screen.queryByRole('combobox', { name: 'Cliente' })).not.toBeInTheDocument()

    fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Membresía' }))
    expect(await screen.findByRole('option', { name: /Plan Básico/i })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('option', { name: /Plan Básico/i }))
    fireEvent.click(screen.getByRole('button', { name: 'Crear suscripción' }))

    const dialog = await screen.findByRole('dialog')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Crear suscripción' }))

    expect(await screen.findByText('Detalle de suscripción')).toBeInTheDocument()

    const call = fetchMock.mock.calls.find(
      ([input, init]) =>
        String(input).includes('/memberships/1/subscriptions') &&
        (init as RequestInit | undefined)?.method === 'POST',
    )
    expect(call).toBeDefined()
    expect(JSON.parse(String((call?.[1] as RequestInit).body))).toMatchObject({
      clientId: 1,
      membershipId: 1,
    })
  })

  it('shows the Stripe checkout link when the API returns one', async () => {
    mockApi((url, init) => {
      if (url.includes('/memberships/1/subscriptions')) {
        return json(
          {
            ...subscriptions[0],
            id: 12,
            status: 'PENDING',
            checkoutUrl: 'https://checkout.stripe.com/test',
          },
          201,
        )
      }
      return defaultHandler(url, init)
    })
    renderPage(
      <SubscriptionFormPage />,
      ['/subscriptions/new'],
      <Routes>
        <Route path="/subscriptions/new" element={<SubscriptionFormPage />} />
      </Routes>,
    )

    fireEvent.mouseDown(await screen.findByRole('combobox', { name: 'Cliente' }))
    fireEvent.click(await screen.findByRole('option', { name: /Ana Torres/i }))
    fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Membresía' }))
    fireEvent.click(screen.getByRole('option', { name: /Plan Básico/i }))
    fireEvent.click(screen.getByRole('button', { name: 'Crear suscripción' }))

    const dialog = await screen.findByRole('dialog')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Crear suscripción' }))

    const link = await screen.findByRole('link', { name: 'Continuar en Stripe' })
    expect(link).toHaveAttribute('href', 'https://checkout.stripe.com/test')
    expect(screen.getByText(/no maneja claves privadas de Stripe/i)).toBeInTheDocument()
  })

  it('confirms a manual pending payment with explicit confirmation', async () => {
    const fetchMock = mockApi(defaultHandler)
    renderPage(
      <SubscriptionDetailPage />,
      ['/subscriptions/11'],
      <Routes>
        <Route path="/subscriptions/:id" element={<SubscriptionDetailPage />} />
      </Routes>,
    )

    expect(await screen.findByRole('heading', { name: 'Suscripción #11' })).toBeInTheDocument()
    expect(screen.getByText('Pendiente')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar pago manual' }))

    const dialog = await screen.findByRole('dialog')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Confirmar pago' }))

    expect(
      await screen.findByText('Pago manual confirmado y suscripción activada.'),
    ).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/subscriptions/11/payment-confirmation'),
      expect.objectContaining({ method: 'POST' }),
    )
  })

  it('hides staff actions and payments from clients', async () => {
    authState.user.role = 'CLIENT'
    authState.user.clientId = 1
    const fetchMock = mockApi(defaultHandler)
    renderPage(
      <SubscriptionDetailPage />,
      ['/subscriptions/11'],
      <Routes>
        <Route path="/subscriptions/:id" element={<SubscriptionDetailPage />} />
      </Routes>,
    )

    expect(await screen.findByRole('heading', { name: 'Suscripción #11' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Confirmar pago manual' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Cancelar suscripción' })).not.toBeInTheDocument()
    expect(screen.queryByText('Pagos')).not.toBeInTheDocument()
    await waitFor(() => {
      expect(fetchMock).not.toHaveBeenCalledWith(
        expect.stringContaining('/payments'),
        expect.anything(),
      )
    })
  })
})
