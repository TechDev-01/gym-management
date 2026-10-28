import { Navigate, Route, Routes } from 'react-router-dom'
import { LoginPage, ProtectedRoute } from '../features/auth'
import { DashboardPage } from '../features/dashboard/pages/DashboardPage'

function NotFoundPage() {
  return (
    <main className="not-found">
      <p className="eyebrow">404</p>
      <h1>Página no encontrada</h1>
      <p className="muted">La dirección solicitada no existe.</p>
      <a className="button button-primary" href="/dashboard">
        Volver al dashboard
      </a>
    </main>
  )
}

export function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
