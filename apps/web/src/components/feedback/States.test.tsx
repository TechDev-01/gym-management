import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { EmptyState, ErrorState, LoadingState } from './States'

describe('feedback states', () => {
  it('exposes loading feedback to assistive technology', () => {
    render(<LoadingState label="Cargando clientes..." />)

    expect(screen.getByRole('progressbar')).toBeInTheDocument()
    expect(screen.getByText('Cargando clientes...')).toBeInTheDocument()
  })

  it('renders errors as an alert', () => {
    render(<ErrorState message="No fue posible cargar los clientes." />)

    expect(screen.getByRole('alert')).toHaveTextContent('No fue posible cargar los clientes.')
  })

  it('renders an explicit empty state', () => {
    render(<EmptyState message="No hay clientes registrados." />)

    expect(screen.getByText('No hay clientes registrados.')).toBeInTheDocument()
  })
})
