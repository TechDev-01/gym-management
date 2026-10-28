import { Component, type ErrorInfo, type ReactNode } from 'react'

interface AppErrorBoundaryProps {
  children: ReactNode
}

interface AppErrorBoundaryState {
  hasError: boolean
}

export class AppErrorBoundary extends Component<
  AppErrorBoundaryProps,
  AppErrorBoundaryState
> {
  state: AppErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Frontend runtime error', { error, componentStack: info.componentStack })
  }

  render(): ReactNode {
    if (!this.state.hasError) return this.props.children

    return (
      <main className="runtime-error" role="alert">
        <p className="eyebrow">Error inesperado</p>
        <h1>No pudimos cargar la aplicación</h1>
        <p className="muted">Recarga la página para intentar recuperar la sesión.</p>
        <button className="button button-primary" type="button" onClick={() => window.location.reload()}>
          Recargar aplicación
        </button>
      </main>
    )
  }
}
