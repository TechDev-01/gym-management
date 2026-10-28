import { Navigate, Route, Routes } from 'react-router-dom'
import {
  attendanceViewRoles,
  clientManageRoles,
  clientViewRoles,
  coachManageRoles,
  coachViewRoles,
  LoginPage,
  membershipManageRoles,
  membershipViewRoles,
  paymentViewRoles,
  progressViewRoles,
  ProtectedRoute,
  RoleGuard,
  routineManageRoles,
  routineViewRoles,
  statsViewRoles,
  subscriptionCreateRoles,
  subscriptionViewRoles,
} from '../features/auth'
import { AttendancePage } from '../features/attendance'
import { ClientDetailPage, ClientFormPage, ClientsPage } from '../features/clients'
import { CoachDetailPage, CoachFormPage, CoachesPage } from '../features/coaches'
import { DashboardPage } from '../features/dashboard/pages/DashboardPage'
import {
  MembershipFormPage,
  MembershipsPage,
  SubscriptionDetailPage,
  SubscriptionFormPage,
  SubscriptionsPage,
} from '../features/memberships'
import { PaymentsPage } from '../features/payments'
import { ProgressPage } from '../features/progress'
import { StatsPage } from '../features/stats'
import {
  AssignmentsPage,
  ExercisesPage,
  RoutineDetailPage,
  RoutineFormPage,
  RoutinesPage,
} from '../features/routines'

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
        <Route element={<RoleGuard roles={statsViewRoles} />}>
          <Route path="/stats" element={<StatsPage />} />
        </Route>
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
        <Route element={<RoleGuard roles={membershipViewRoles} />}>
          <Route path="/memberships" element={<MembershipsPage />} />
        </Route>
        <Route element={<RoleGuard roles={membershipManageRoles} />}>
          <Route path="/memberships/new" element={<MembershipFormPage />} />
          <Route path="/memberships/:id/edit" element={<MembershipFormPage editing />} />
        </Route>
        <Route element={<RoleGuard roles={subscriptionViewRoles} />}>
          <Route path="/subscriptions" element={<SubscriptionsPage />} />
          <Route path="/subscriptions/:id" element={<SubscriptionDetailPage />} />
        </Route>
        <Route element={<RoleGuard roles={subscriptionCreateRoles} />}>
          <Route path="/subscriptions/new" element={<SubscriptionFormPage />} />
        </Route>
        <Route element={<RoleGuard roles={paymentViewRoles} />}>
          <Route path="/payments" element={<PaymentsPage />} />
        </Route>
        <Route element={<RoleGuard roles={attendanceViewRoles} />}>
          <Route path="/attendance" element={<AttendancePage />} />
        </Route>
        <Route element={<RoleGuard roles={routineManageRoles} />}>
          <Route path="/routines/new" element={<RoutineFormPage />} />
          <Route path="/routines/exercises" element={<ExercisesPage />} />
          <Route path="/routines/assignments" element={<AssignmentsPage />} />
          <Route path="/routines/:id/edit" element={<RoutineFormPage editing />} />
        </Route>
        <Route element={<RoleGuard roles={routineViewRoles} />}>
          <Route path="/routines" element={<RoutinesPage />} />
          <Route path="/routines/:id" element={<RoutineDetailPage />} />
        </Route>
        <Route element={<RoleGuard roles={progressViewRoles} />}>
          <Route path="/progress" element={<ProgressPage />} />
        </Route>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
