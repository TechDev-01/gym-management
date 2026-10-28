import { Alert, Button, Stack, TableCell, TableRow, Typography } from '@mui/material'
import { useMemo, useState } from 'react'
import { EmptyState, ErrorState, LoadingState } from '../../../components/feedback/States'
import { DataTable } from '../../../components/ui/DataTable'
import { Panel } from '../../../components/ui/Panel'
import { StatusBadge } from '../../../components/ui/StatusBadge'
import { HttpError } from '../../../lib/http'
import { formatDateTime } from '../../../utils/format'
import { useClients } from '../../clients/hooks'
import { formatDuration } from '../dates'
import { attendanceErrorMessage } from '../errors'
import { useAttendance, useCheckOut } from '../hooks'

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof HttpError || error instanceof Error ? error.message : fallback
}

export function OpenAttendancesPanel() {
  const openQuery = useAttendance({ open: true, page: 1, limit: 100 })
  const clientsQuery = useClients()
  const checkOutMutation = useCheckOut()
  const [actionError, setActionError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const clientNames = useMemo(
    () =>
      new Map(
        (clientsQuery.data ?? []).map((client) => [
          client.id,
          `${client.name} ${client.lastName}`,
        ]),
      ),
    [clientsQuery.data],
  )
  const openAttendances = openQuery.data?.items ?? []

  const runCheckOut = async (attendanceId: number) => {
    setActionError(null)
    setSuccessMessage(null)

    try {
      await checkOutMutation.mutateAsync(attendanceId)
      setSuccessMessage('Salida registrada correctamente.')
    } catch (error: unknown) {
      setActionError(attendanceErrorMessage(error, 'No fue posible registrar la salida.'))
    }
  }

  return (
    <Panel
      title="Dentro del gimnasio"
      subtitle={
        openQuery.data
          ? `${openQuery.data.total} ${openQuery.data.total === 1 ? 'asistencia abierta' : 'asistencias abiertas'}`
          : 'Clientes con entrada registrada y sin salida.'
      }
    >
      <Stack spacing={1.5} sx={{ mt: 2 }}>
        {actionError && <Alert severity="error">{actionError}</Alert>}
        {successMessage && <Alert severity="success">{successMessage}</Alert>}
        {openQuery.isLoading && <LoadingState label="Cargando asistencias abiertas..." />}
        {openQuery.isError && (
          <ErrorState
            message={errorMessage(
              openQuery.error,
              'No fue posible cargar las asistencias abiertas.',
            )}
          />
        )}
        {openQuery.isSuccess && openAttendances.length === 0 && (
          <EmptyState message="No hay asistencias abiertas en este momento." />
        )}
        {openQuery.isSuccess && openAttendances.length > 0 && (
          <DataTable headers={['CLIENTE', 'ENTRADA', 'TIEMPO', 'ESTADO', 'ACCIÓN']} minWidth={720}>
            {openAttendances.map((attendance) => {
              const isClosing =
                checkOutMutation.isPending && checkOutMutation.variables === attendance.id

              return (
                <TableRow key={attendance.id} hover>
                  <TableCell>
                    {clientNames.get(attendance.clientId) ?? `Cliente #${attendance.clientId}`}
                  </TableCell>
                  <TableCell>{formatDateTime(attendance.checkInAt)}</TableCell>
                  <TableCell>{formatDuration(attendance.checkInAt, null)}</TableCell>
                  <TableCell>
                    <StatusBadge label="En curso" status="pending" />
                  </TableCell>
                  <TableCell>
                    <Button
                      size="small"
                      variant="outlined"
                      color="warning"
                      onClick={() => { void runCheckOut(attendance.id) }}
                      disabled={checkOutMutation.isPending}
                      aria-label={`Registrar salida de ${clientNames.get(attendance.clientId) ?? `cliente ${attendance.clientId}`}`}
                    >
                      {isClosing ? 'Registrando...' : 'Registrar salida'}
                    </Button>
                  </TableCell>
                </TableRow>
              )
            })}
          </DataTable>
        )}
        {openQuery.isSuccess && clientsQuery.isError && (
          <Typography variant="caption" color="text.secondary">
            No fue posible resolver los nombres de los clientes.
          </Typography>
        )}
      </Stack>
    </Panel>
  )
}
