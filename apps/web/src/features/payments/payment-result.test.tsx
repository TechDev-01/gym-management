import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it } from 'vitest'
import { AppProviders } from '../../app/providers'
import { AppRouter } from '../../app/router'

function renderRoute(path: string) {
  return render(
    <AppProviders>
      <MemoryRouter initialEntries={[path]}>
        <AppRouter />
      </MemoryRouter>
    </AppProviders>,
  )
}

describe('payment result routes', () => {
  afterEach(() => {
    cleanup()
    sessionStorage.clear()
  })

  it('renders the success page without requiring a session', () => {
    renderRoute('/payment-success')

    expect(screen.getByRole('heading', { name: 'Gracias por tu pago' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Iniciar sesión' })).toHaveAttribute('href', '/login')
  })

  it('renders the cancelled page without requiring a session', () => {
    renderRoute('/payment-cancelled')

    expect(screen.getByRole('heading', { name: 'No se completó el pago' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Iniciar sesión' })).toHaveAttribute('href', '/login')
  })
})
