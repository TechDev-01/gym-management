import { Box, Grid } from '@mui/material'
import { useState } from 'react'
import { EmptyState, ErrorState } from '../../../components/feedback/States'
import { AppShell } from '../../../components/layout/AppShell'
import { PageHeader } from '../../../components/layout/PageHeader'
import { Panel } from '../../../components/ui/Panel'
import { canManageAttendance, canViewAttendance, useAuth } from '../../auth'
import type { Client } from '../../clients/types'
import { AttendanceCheckInPanel } from '../components/AttendanceCheckInPanel'
import { AttendanceClientSearch } from '../components/AttendanceClientSearch'
import { AttendanceHistoryPanel } from '../components/AttendanceHistoryPanel'
import { OpenAttendancesPanel } from '../components/OpenAttendancesPanel'

export function AttendancePage() {
  const { user } = useAuth()
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const isStaff = canManageAttendance(user?.role)
  const isClient = user?.role === 'CLIENT'
  const clientId = user?.clientId

  if (!canViewAttendance(user?.role)) {
    return (
      <AppShell>
        <ErrorState message="No tienes permiso para consultar la asistencia." />
      </AppShell>
    )
  }

  if (isClient && !clientId) {
    return (
      <AppShell>
        <ErrorState message="Tu usuario no tiene un cliente asociado para consultar la asistencia." />
      </AppShell>
    )
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow={isClient ? 'Mi actividad' : 'Operación diaria'}
        title={isClient ? 'Mi asistencia' : 'Asistencia'}
        subtitle={
          isClient
            ? 'Consulta tu membresía, registra tu entrada o salida y revisa tu historial.'
            : 'Registra entradas y salidas con búsqueda rápida y controla quién está en el gimnasio.'
        }
      />

      <Grid container spacing={2} sx={{ mb: 2 }}>
        {isStaff && (
          <Grid size={{ xs: 12, md: 5 }}>
            <AttendanceClientSearch
              selectedClientId={selectedClient?.id ?? null}
              onSelect={setSelectedClient}
            />
          </Grid>
        )}
        <Grid size={{ xs: 12, md: isStaff ? 7 : 12 }}>
          {isClient ? (
            clientId ? (
              <AttendanceCheckInPanel clientId={clientId} selfService />
            ) : null
          ) : selectedClient ? (
            <AttendanceCheckInPanel
              key={selectedClient.id}
              clientId={selectedClient.id}
              client={selectedClient}
            />
          ) : (
            <Panel
              title="Estado de acceso"
              subtitle="Selecciona un cliente para consultar su membresía y registrar su asistencia."
            >
              <Box sx={{ mt: 2 }}>
                <EmptyState message="Aún no has seleccionado un cliente." />
              </Box>
            </Panel>
          )}
        </Grid>
      </Grid>

      {isStaff && (
        <Box sx={{ mb: 2 }}>
          <OpenAttendancesPanel />
        </Box>
      )}

      <AttendanceHistoryPanel showClient={isStaff} />
    </AppShell>
  )
}
