import { Navigate, Route, Routes } from 'react-router-dom'
import {
  clientManageRoles,
  clientViewRoles,
  coachManageRoles,
  coachViewRoles,
  LoginPage,
  ProtectedRoute,
  RoleGuard,
} from '../features/auth'
import { ClientDetailPage, ClientFormPage, ClientsPage } from '../features/clients'
import { CoachDetailPage, CoachFormPage, CoachesPage } from '../features/coaches'
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
        <Route element={<RoleGuard roles={clientViewRoles} />}>
          <Route path="/clients" element={<ClientsPage />} />
          <Route path="/clients/:id" element={<ClientDetailPage />} />
        </Route>
        <Route element={<RoleGuard roles={clientManageRoles} />}>
          <Route path="/clients/new" element={<ClientFormPage />} />
          <Route path="/clients/:id/edit" element={<ClientFormPage editing />} />
        </Route>
        <Route element={<RoleGuard roles={coachViewRoles} />}>
          <Route path="/coaches" element={<CoachesPage />} />
          <Route path="/coaches/:id" element={<CoachDetailPage />} />
        </Route>
        <Route element={<RoleGuard roles={coachManageRoles} />}>
          <Route path="/coaches/new" element={<CoachFormPage />} />
          <Route path="/coaches/:id/edit" element={<CoachFormPage editing />} />
        </Route>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
