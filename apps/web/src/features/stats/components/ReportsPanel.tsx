import { Alert, Button, Stack, TableCell, TableRow, Typography } from '@mui/material'
import { useState } from 'react'
import { EmptyState } from '../../../components/feedback/States'
import { DataTable } from '../../../components/ui/DataTable'
import { Panel } from '../../../components/ui/Panel'
import { StatusBadge } from '../../../components/ui/StatusBadge'
import { HttpError } from '../../../lib/http'
import { formatCurrency, formatDateTime } from '../../../utils/format'
import { useReportStatus, useRequestReport } from '../hooks'
import { reportStatusMeta } from '../labels'
import type { StatsFilters } from '../types'

interface RequestedReport {
  jobId: string
  requestedAt: string
}

interface ReportsPanelProps {
  filters: StatsFilters
  disabled?: boolean
}

function errorMessage(error: unknown): string {
  return error instanceof HttpError || error instanceof Error
    ? error.message
    : 'No fue posible consultar el estado del reporte.'
}

export function ReportsPanel({ filters, disabled = false }: ReportsPanelProps) {
  const [requests, setRequests] = useState<RequestedReport[]>([])
  const requestMutation = useRequestReport()

  const handleRequest = (): void => {
    requestMutation.mutate(filters, {
      onSuccess: (report) => {
        setRequests((current) => [
          { jobId: report.jobId, requestedAt: new Date().toISOString() },
          ...current,
        ].slice(0, 10))
      },
    })
  }

  return (
    <Panel
      title="Reportes"
      subtitle="Solicita un resumen administrativo y sigue su estado."
      action={
        <Button
          variant="contained"
          onClick={handleRequest}
          disabled={disabled || requestMutation.isPending}
        >
          {requestMutation.isPending ? 'Solicitando...' : 'Solicitar reporte'}
        </Button>
      }
    >
      <Stack spacing={2} sx={{ mt: 2 }}>
        {requestMutation.isError && (
          <Alert severity="error">{errorMessage(requestMutation.error)}</Alert>
        )}
        <Typography variant="caption" color="text.secondary">
          Las solicitudes se conservan durante esta sesión.
        </Typography>
        {requests.length === 0 ? (
          <EmptyState message="Aún no has solicitado reportes en esta sesión." />
        ) : (
          <DataTable
            headers={['REPORTE', 'SOLICITADO', 'ESTADO', 'DETALLE']}
            minWidth={720}
          >
            {requests.map((report) => (
              <ReportRow key={report.jobId} report={report} />
            ))}
          </DataTable>
        )}
      </Stack>
    </Panel>
  )
}

function ReportRow({ report }: { report: RequestedReport }) {
  const statusQuery = useReportStatus(report.jobId)
  const data = statusQuery.data
  const status = data?.status ?? 'pending'
  const meta = reportStatusMeta(status)

  return (
    <TableRow>
      <TableCell>
        <Typography variant="body2">Resumen del dashboard</Typography>
        <Typography variant="caption" color="text.disabled">{report.jobId}</Typography>
      </TableCell>
      <TableCell>{formatDateTime(report.requestedAt)}</TableCell>
      <TableCell>
        <StatusBadge label={meta.label} status={meta.tone} />
      </TableCell>
      <TableCell>
        {statusQuery.isError && errorMessage(statusQuery.error)}
        {!statusQuery.isError && status === 'pending' && 'En proceso...'}
        {!statusQuery.isError && status === 'failed' && (data?.error ?? 'El reporte falló.')}
        {!statusQuery.isError && status === 'completed' && (
          data?.result
            ? `${data.result.clients.active.toLocaleString('es-MX')} clientes · ${data.result.attendance.total.toLocaleString('es-MX')} asistencias · ${formatCurrency(data.result.revenue.amount, data.result.revenue.currency ?? 'USD')}`
            : 'Reporte generado.'
        )}
      </TableCell>
    </TableRow>
  )
}
