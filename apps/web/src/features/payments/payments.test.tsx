import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AppProviders } from '../../app/providers'
import { PaymentsPage } from './pages/PaymentsPage'

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
    receiptUrl: 'https://receipt.example.com/20',
    recordedById: 1,
    paidAt: '2026-10-01T10:00:00.000Z',
    createdAt: '2026-10-01T10:00:00.000Z',
    stripeCheckoutSessionId: 'cs_secret',
    stripePaymentIntentId: 'pi_secret',
  },
  {
    id: 21,
    clientId: 2,
    subscriptionId: 11,
    method: 'CARD',
    status: 'PENDING',
    amount: 9000,
    currency: 'cop',
    refundedAmount: 0,
    receiptUrl: null,
    recordedById: null,
    paidAt: null,
    createdAt: '2026-10-20T10:00:00.000Z',
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

function defaultHandler(url: string): Response {
  if (url.includes('/payments')) {
    return json(payments)
  }

  if (url.endsWith('/clients')) {
    return json(clients)
  }

  return json({ error: 'not found' }, 404)
}

function renderPaymentsPage() {
  return render(
    <AppProviders>
      <MemoryRouter>
        <PaymentsPage />
      </MemoryRouter>
    </AppProviders>,
  )
}

describe('payments module', () => {
  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
  })

  it('lists payments with client names, statuses and receipts', async () => {
    mockApi(defaultHandler)
    renderPaymentsPage()

    expect(await screen.findByText('Ana Torres')).toBeInTheDocument()
    expect(screen.getByText('Luis Pérez')).toBeInTheDocument()
    expect(screen.getByText('Completado')).toBeInTheDocument()
    expect(screen.getByText('Pendiente')).toBeInTheDocument()
    expect(screen.getByText('Efectivo')).toBeInTheDocument()
    expect(screen.getByText('Tarjeta')).toBeInTheDocument()
    expect(screen.getByText(/3,500/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ver recibo' })).toHaveAttribute(
      'href',
      'https://receipt.example.com/20',
    )
    expect(screen.queryByText('cs_secret')).not.toBeInTheDocument()
    expect(screen.queryByText('pi_secret')).not.toBeInTheDocument()
  })

  it('sends status and method filters to the API', async () => {
    const fetchMock = mockApi((url) => {
      if (url.includes('status=FAILED')) {
        return json([])
      }
      return defaultHandler(url)
    })
    renderPaymentsPage()

    expect(await screen.findByText('Ana Torres')).toBeInTheDocument()

    fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Estado del pago' }))
    fireEvent.click(screen.getByRole('option', { name: 'Fallidos' }))

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('payments?status=FAILED'),
        expect.anything(),
      )
    })
    expect(await screen.findByText(/No hay pagos que coincidan/i)).toBeInTheDocument()

    fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Método de pago' }))
    fireEvent.click(screen.getByRole('option', { name: 'Transferencia' }))

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('method=TRANSFER'),
        expect.anything(),
      )
    })
  })

  it('shows an empty state when there are no payments', async () => {
    mockApi((url) => {
      if (url.includes('/payments')) {
        return json([])
      }
      return defaultHandler(url)
    })
    renderPaymentsPage()

    expect(await screen.findByText('No hay pagos registrados.')).toBeInTheDocument()
  })
})
