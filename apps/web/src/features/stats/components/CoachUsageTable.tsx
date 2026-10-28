import { TableCell, TableRow } from '@mui/material'
import { EmptyState } from '../../../components/feedback/States'
import { DataTable } from '../../../components/ui/DataTable'
import { Panel } from '../../../components/ui/Panel'
import type { StatsData } from '../types'

export function CoachUsageTable({ coaches }: { coaches: StatsData['coachUsage'] }) {
  return (
    <Panel
      title="Segmentación por entrenador"
      subtitle="Actividad registrada por cada entrenador en el periodo"
    >
      {coaches.length === 0 ? (
        <EmptyState message="No hay actividad de entrenadores para este periodo." />
      ) : (
        <DataTable headers={['ENTRENADOR', 'RUTINAS', 'ASIGNACIONES', 'PROGRESOS']}>
          {coaches.map((coach) => (
            <TableRow key={coach.coachId}>
              <TableCell>{coach.coachName}</TableCell>
              <TableCell>{coach.routinesCreated.toLocaleString('es-MX')}</TableCell>
              <TableCell>{coach.routineAssignments.toLocaleString('es-MX')}</TableCell>
              <TableCell>{coach.progressRecords.toLocaleString('es-MX')}</TableCell>
            </TableRow>
          ))}
        </DataTable>
      )}
    </Panel>
  )
}
