import { Button, Stack, TableCell, TableRow, Typography } from '@mui/material'
import { DataTable } from '../../../components/ui/DataTable'
import { Panel } from '../../../components/ui/Panel'
import { muscleGroupLabels } from '../labels'
import type { RoutineExercise } from '../types'

interface RoutineDayPanelProps {
  dayNumber: number
  exercises: RoutineExercise[]
  canManage: boolean
  onEdit: (item: RoutineExercise) => void
  onDelete: (item: RoutineExercise) => void
}

export function RoutineDayPanel({
  dayNumber,
  exercises,
  canManage,
  onEdit,
  onDelete,
}: RoutineDayPanelProps) {
  return (
    <Panel
      title={`Día ${dayNumber}`}
      subtitle={`${exercises.length} ${exercises.length === 1 ? 'ejercicio' : 'ejercicios'}`}
    >
      <Stack sx={{ mt: 2 }}>
        <DataTable
          headers={
            canManage
              ? ['POS.', 'EJERCICIO', 'SERIES', 'REPS', 'PESO', 'DESCANSO', 'NOTAS', 'ACCIONES']
              : ['POS.', 'EJERCICIO', 'SERIES', 'REPS', 'PESO', 'DESCANSO', 'NOTAS']
          }
          minWidth={canManage ? 900 : 760}
        >
          {exercises.map((item) => (
            <TableRow key={item.id} hover>
              <TableCell>{item.position}</TableCell>
              <TableCell>
                {item.exercise?.name ?? `Ejercicio #${item.exerciseId}`}
                {item.exercise && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                    {muscleGroupLabels[item.exercise.muscleGroup]}
                  </Typography>
                )}
              </TableCell>
              <TableCell>{item.sets}</TableCell>
              <TableCell>{item.reps}</TableCell>
              <TableCell>{item.weightKg === null ? '—' : `${item.weightKg} kg`}</TableCell>
              <TableCell>
                {item.restSeconds === null ? '—' : `${item.restSeconds} s`}
              </TableCell>
              <TableCell>{item.notes ?? '—'}</TableCell>
              {canManage && (
                <TableCell>
                  <Stack sx={{ flexDirection: 'row', gap: 0.5 }}>
                    <Button size="small" onClick={() => onEdit(item)}>
                      Editar
                    </Button>
                    <Button size="small" color="error" onClick={() => onDelete(item)}>
                      Eliminar
                    </Button>
                  </Stack>
                </TableCell>
              )}
            </TableRow>
          ))}
        </DataTable>
      </Stack>
    </Panel>
  )
}
