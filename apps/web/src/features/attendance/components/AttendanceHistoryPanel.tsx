import {
  Button,
  Stack,
  TableCell,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import { useMemo, useState } from 'react'
import { EmptyState, ErrorState, LoadingState } from '../../../components/feedback/States'
import { DataTable } from '../../../components/ui/DataTable'
import { Panel } from '../../../components/ui/Panel'
import { StatusBadge } from '../../../components/ui/StatusBadge'
import { HttpError } from '../../../lib/http'
import { formatDateTime } from '../../../utils/format'
import { useClients } from '../../clients/hooks'
import { formatDuration, todayDateString } from '../dates'
import { useAttendance } from '../hooks'

interface AttendanceHistoryPanelProps {
  showClient: boolean
}

const pageSize = 20

function errorMessage(error: unknown): string {
  return error instanceof HttpError || error instanceof Error
    ? error.message
    : 'No fue posible cargar el historial de asistencia.'
}

export function AttendanceHistoryPanel({ showClient }: AttendanceHistoryPanelProps) {
  const [from, setFrom] = useState(() => todayDateString())
  const [to, setTo] = useState(() => todayDateString())
  const [page, setPage] = useState(1)
  const invalidRange = from !== '' && to !== '' && from > to
  const historyQuery = useAttendance(
    {
      from: from || undefined,
      to: to || undefined,
      page,
      limit: pageSize,
    },
    !invalidRange,
  )
  const clientsQuery = useClients(showClient)
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
  const attendances = historyQuery.data?.items ?? []
  const total = historyQuery.data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const headers = showClient
    ? ['CLIENTE', 'ENTRADA', 'SALIDA', 'DURACIÓN', 'ESTADO']
    : ['ENTRADA', 'SALIDA', 'DURACIÓN', 'ESTADO']

  const updateFrom = (value: string) => {
    setFrom(value)
    setPage(1)
  }

  const updateTo = (value: string) => {
    setTo(value)
    setPage(1)
  }

  const resetToToday = () => {
    const today = todayDateString()
    setFrom(today)
    setTo(today)
    setPage(1)
  }

  const clearDates = () => {
    setFrom('')
    setTo('')
    setPage(1)
  }

  return (
    <Panel
      title="Historial de asistencia"
      subtitle="Consulta las entradas y salidas por periodo."
    >
      <Stack spacing={2} sx={{ mt: 2 }}>
        <Stack sx={{ flexDirection: { xs: 'column', sm: 'row' }, gap: 1.5 }}>
          <TextField
            type="date"
            size="small"
            label="Desde"
            value={from}
            onChange={(event) => updateFrom(event.target.value)}
            error={invalidRange}
            slotProps={{ inputLabel: { shrink: true } }}
            sx={{ flex: 1 }}
          />
          <TextField
            type="date"
            size="small"
            label="Hasta"
            value={to}
            onChange={(event) => updateTo(event.target.value)}
            error={invalidRange}
            slotProps={{ inputLabel: { shrink: true } }}
            sx={{ flex: 1 }}
          />
          <Button variant="outlined" onClick={resetToToday}>
            Hoy
          </Button>
          <Button variant="text" onClick={clearDates}>
            Limpiar
          </Button>
        </Stack>

        {invalidRange && (
          <Typography variant="body2" color="error">
            La fecha inicial no puede ser posterior a la fecha final.
          </Typography>
        )}
        {historyQuery.isLoading && <LoadingState label="Cargando historial..." />}
        {historyQuery.isError && <ErrorState message={errorMessage(historyQuery.error)} />}
        {historyQuery.isSuccess && (
          <Typography variant="caption" color="text.secondary">
            {total} {total === 1 ? 'asistencia' : 'asistencias'}
          </Typography>
        )}
        {historyQuery.isSuccess && attendances.length === 0 && (
          <EmptyState message="No hay asistencias registradas para el periodo seleccionado." />
        )}
        {historyQuery.isSuccess && attendances.length > 0 && (
          <>
            <DataTable headers={headers} minWidth={showClient ? 820 : 620}>
              {attendances.map((attendance) => (
                <TableRow key={attendance.id} hover>
                  {showClient && (
                    <TableCell>
                      {clientNames.get(attendance.clientId) ??
                        `Cliente #${attendance.clientId}`}
                    </TableCell>
                  )}
                  <TableCell>{formatDateTime(attendance.checkInAt)}</TableCell>
                  <TableCell>{formatDateTime(attendance.checkOutAt)}</TableCell>
                  <TableCell>
                    {formatDuration(attendance.checkInAt, attendance.checkOutAt)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge
                      label={attendance.checkOutAt ? 'Cerrada' : 'En curso'}
                      status={attendance.checkOutAt ? 'success' : 'pending'}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </DataTable>
            <Stack
              sx={{
                alignItems: 'center',
                flexDirection: 'row',
                gap: 1,
                justifyContent: 'space-between',
              }}
            >
              <Button
                variant="outlined"
                size="small"
                onClick={() => setPage((value) => Math.max(1, value - 1))}
                disabled={page <= 1 || historyQuery.isFetching}
              >
                Anterior
              </Button>
              <Typography variant="caption" color="text.secondary">
                Página {page} de {totalPages}
              </Typography>
              <Button
                variant="outlined"
                size="small"
                onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
                disabled={page >= totalPages || historyQuery.isFetching}
              >
                Siguiente
              </Button>
            </Stack>
          </>
        )}
      </Stack>
    </Panel>
  )
}
