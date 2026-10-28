import {
  Button,
  MenuItem,
  Stack,
  TableCell,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import { useMemo, useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { EmptyState, ErrorState, LoadingState } from '../../../components/feedback/States'
import { SearchField } from '../../../components/forms/SearchField'
import { AppShell } from '../../../components/layout/AppShell'
import { PageHeader } from '../../../components/layout/PageHeader'
import { DataTable } from '../../../components/ui/DataTable'
import { Icon } from '../../../components/ui/Icon'
import { HttpError } from '../../../lib/http'
import { ExerciseFormDialog } from '../components/ExerciseFormDialog'
import { useExercises } from '../hooks'
import { muscleGroupLabels } from '../labels'
import { muscleGroups, type Exercise, type MuscleGroup } from '../types'

function errorMessage(error: unknown): string {
  return error instanceof HttpError || error instanceof Error
    ? error.message
    : 'No fue posible cargar los ejercicios.'
}

export function ExercisesPage() {
  const exercisesQuery = useExercises()
  const [search, setSearch] = useState('')
  const [muscleGroup, setMuscleGroup] = useState<MuscleGroup | 'all'>('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null)

  const exercises = useMemo(() => {
    const normalized = search.trim().toLowerCase()

    return (exercisesQuery.data ?? []).filter((exercise) => {
      const matchesSearch =
        !normalized ||
        `${exercise.name} ${exercise.equipment ?? ''} ${exercise.description ?? ''}`
          .toLowerCase()
          .includes(normalized)
      const matchesGroup =
        muscleGroup === 'all' || exercise.muscleGroup === muscleGroup

      return matchesSearch && matchesGroup
    })
  }, [exercisesQuery.data, muscleGroup, search])

  return (
    <AppShell>
      <PageHeader
        eyebrow="Catálogo"
        title="Ejercicios"
        subtitle="Base compartida de ejercicios para configurar rutinas."
        actions={
          <Stack sx={{ flexDirection: 'row', gap: 1 }}>
            <Button component={RouterLink} to="/routines" variant="outlined">
              Volver a rutinas
            </Button>
            <Button
              variant="contained"
              startIcon={<Icon name="add" size={18} />}
              onClick={() => {
                setEditingExercise(null)
                setDialogOpen(true)
              }}
            >
              Nuevo ejercicio
            </Button>
          </Stack>
        }
      />
      <Stack spacing={2}>
        <Stack sx={{ flexDirection: { xs: 'column', sm: 'row' }, gap: 1.5 }}>
          <SearchField
            value={search}
            onChange={setSearch}
            placeholder="Buscar por nombre, equipamiento o descripción"
            label="Buscar ejercicios"
          />
          <TextField
            select
            size="small"
            label="Grupo muscular"
            value={muscleGroup}
            onChange={(event) => setMuscleGroup(event.target.value as MuscleGroup | 'all')}
            sx={{ minWidth: { sm: 220 } }}
          >
            <MenuItem value="all">Todos</MenuItem>
            {muscleGroups.map((group) => (
              <MenuItem key={group} value={group}>
                {muscleGroupLabels[group]}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
        {exercisesQuery.isLoading && <LoadingState label="Cargando ejercicios..." />}
        {exercisesQuery.isError && <ErrorState message={errorMessage(exercisesQuery.error)} />}
        {exercisesQuery.isSuccess && (
          <Typography variant="caption" color="text.secondary">
            {exercises.length} de {exercisesQuery.data.length} ejercicios
          </Typography>
        )}
        {exercisesQuery.isSuccess && exercises.length === 0 && (
          <EmptyState
            message={
              search || muscleGroup !== 'all'
                ? 'No hay ejercicios que coincidan con los filtros.'
                : 'No hay ejercicios registrados.'
            }
          />
        )}
        {exercisesQuery.isSuccess && exercises.length > 0 && (
          <DataTable headers={['EJERCICIO', 'GRUPO MUSCULAR', 'EQUIPAMIENTO', 'ACCIONES']} minWidth={760}>
            {exercises.map((exercise) => (
              <TableRow key={exercise.id} hover>
                <TableCell>
                  {exercise.name}
                  {exercise.description && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      {exercise.description}
                    </Typography>
                  )}
                </TableCell>
                <TableCell>{muscleGroupLabels[exercise.muscleGroup]}</TableCell>
                <TableCell>{exercise.equipment ?? '—'}</TableCell>
                <TableCell>
                  <Button
                    size="small"
                    onClick={() => {
                      setEditingExercise(exercise)
                      setDialogOpen(true)
                    }}
                  >
                    Editar
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </DataTable>
        )}
      </Stack>
      <ExerciseFormDialog
        open={dialogOpen}
        exercise={editingExercise}
        onClose={() => {
          setDialogOpen(false)
          setEditingExercise(null)
        }}
      />
    </AppShell>
  )
}
