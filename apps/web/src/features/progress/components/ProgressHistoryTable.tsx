import { Button, Stack, TableCell, TableRow, Typography } from '@mui/material'
import { EmptyState } from '../../../components/feedback/States'
import { DataTable } from '../../../components/ui/DataTable'
import { formatDate } from '../../../utils/format'
import type { ProgressRecord } from '../types'

interface ProgressHistoryTableProps {
  records: ProgressRecord[]
  total: number
  page: number
  pageSize: number
  fetching: boolean
  onPageChange: (page: number) => void
}

function metric(value: number | null, unit: string): string {
  return value === null
    ? '—'
    : `${value.toLocaleString('es-MX', { maximumFractionDigits: 2 })} ${unit}`
}

export function ProgressHistoryTable({
  records,
  total,
  page,
  pageSize,
  fetching,
  onPageChange,
}: ProgressHistoryTableProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  if (records.length === 0) {
    return <EmptyState message="No hay mediciones registradas para el periodo seleccionado." />
  }

  return (
    <>
      <DataTable
        headers={[
          'FECHA',
          'PESO',
          'ALTURA',
          'GRASA',
          'MÚSCULO',
          'PECHO',
          'CINTURA',
          'CADERA',
          'BRAZO',
          'MUSLO',
          'NOTAS',
        ]}
        minWidth={1180}
      >
        {records.map((record) => (
          <TableRow key={record.id} hover>
            <TableCell>{formatDate(record.measuredAt)}</TableCell>
            <TableCell>{metric(record.weightKg, 'kg')}</TableCell>
            <TableCell>{metric(record.heightCm, 'cm')}</TableCell>
            <TableCell>{metric(record.bodyFatPct, '%')}</TableCell>
            <TableCell>{metric(record.muscleKg, 'kg')}</TableCell>
            <TableCell>{metric(record.chestCm, 'cm')}</TableCell>
            <TableCell>{metric(record.waistCm, 'cm')}</TableCell>
            <TableCell>{metric(record.hipCm, 'cm')}</TableCell>
            <TableCell>{metric(record.armCm, 'cm')}</TableCell>
            <TableCell>{metric(record.thighCm, 'cm')}</TableCell>
            <TableCell>{record.notes ?? '—'}</TableCell>
          </TableRow>
        ))}
      </DataTable>
      <Stack
        sx={{
          alignItems: 'center',
          flexDirection: 'row',
          gap: 1,
          justifyContent: 'space-between',
          mt: 2,
        }}
      >
        <Button
          variant="outlined"
          size="small"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page <= 1 || fetching}
        >
          Anterior
        </Button>
        <Typography variant="caption" color="text.secondary">
          Página {page} de {totalPages} · {total} {total === 1 ? 'medición' : 'mediciones'}
        </Typography>
        <Button
          variant="outlined"
          size="small"
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages || fetching}
        >
          Siguiente
        </Button>
      </Stack>
    </>
  )
}
