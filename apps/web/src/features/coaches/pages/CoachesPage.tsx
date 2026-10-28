import { Button, Stack, TableCell, TableRow, Typography } from '@mui/material'
import { useMemo, useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { SearchField } from '../../../components/forms/SearchField'
import { StatusFilter, type StatusFilterValue } from '../../../components/forms/StatusFilter'
import { EmptyState, ErrorState, LoadingState } from '../../../components/feedback/States'
import { AppShell } from '../../../components/layout/AppShell'
import { PageHeader } from '../../../components/layout/PageHeader'
import { DataTable } from '../../../components/ui/DataTable'
import { Icon } from '../../../components/ui/Icon'
import { StatusBadge } from '../../../components/ui/StatusBadge'
import { HttpError } from '../../../lib/http'
import { canManageCoaches, useAuth } from '../../auth'
import { useCoaches } from '../hooks'

function errorMessage(error: unknown): string {
  return error instanceof HttpError || error instanceof Error
    ? error.message
    : 'No fue posible cargar los entrenadores.'
}

export function CoachesPage() {
  const { user } = useAuth()
  const coachesQuery = useCoaches()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<StatusFilterValue>('all')
  const canManage = canManageCoaches(user?.role)
  const coaches = useMemo(() => {
    const normalized = search.trim().toLowerCase()

    return (coachesQuery.data ?? []).filter((coach) => {
      const matchesSearch =
        !normalized ||
        `${coach.name} ${coach.lastName} ${coach.email} ${coach.dni} ${coach.phone}`
          .toLowerCase()
          .includes(normalized)
      const matchesStatus =
        status === 'all' ||
        (status === 'active' ? coach.isActive : !coach.isActive)

      return matchesSearch && matchesStatus
    })
  }, [coachesQuery.data, search, status])
  const total = coachesQuery.data?.length ?? 0

  return (
    <AppShell>
      <PageHeader
        eyebrow="Gestión"
        title="Entrenadores"
        subtitle="Administra los perfiles del equipo de entrenamiento."
        actions={
          canManage ? (
            <Button
              component={RouterLink}
              to="/coaches/new"
              variant="contained"
              startIcon={<Icon name="add" size={18} />}
            >
              Nuevo entrenador
            </Button>
          ) : undefined
        }
      />
      <Stack spacing={2}>
        <Stack sx={{ flexDirection: { xs: 'column', sm: 'row' }, gap: 1.5 }}>
          <SearchField
            value={search}
            onChange={setSearch}
            placeholder="Buscar por nombre, correo, DNI o teléfono"
            label="Buscar entrenadores"
          />
          <StatusFilter value={status} onChange={setStatus} />
        </Stack>
        {coachesQuery.isLoading && <LoadingState label="Cargando entrenadores..." />}
        {coachesQuery.isError && <ErrorState message={errorMessage(coachesQuery.error)} />}
        {coachesQuery.isSuccess && (
          <Typography variant="caption" color="text.secondary">
            {coaches.length} de {total} entrenadores
          </Typography>
        )}
        {coachesQuery.isSuccess && coaches.length === 0 && (
          <EmptyState
            message={
              search || status !== 'all'
                ? 'No hay entrenadores que coincidan con los filtros.'
                : 'No hay entrenadores registrados.'
            }
          />
        )}
        {coachesQuery.isSuccess && coaches.length > 0 && (
          <DataTable headers={['ENTRENADOR', 'CONTACTO', 'DNI', 'ESTADO', 'ACCIONES']} minWidth={760}>
            {coaches.map((coach) => (
              <TableRow key={coach.id} hover>
                <TableCell>
                  {coach.name} {coach.lastName}
                </TableCell>
                <TableCell>
                  {coach.email}
                  <br />
                  {coach.phone}
                </TableCell>
                <TableCell>{coach.dni}</TableCell>
                <TableCell>
                  <StatusBadge
                    label={coach.isActive ? 'Activo' : 'Inactivo'}
                    status={coach.isActive ? 'success' : 'error'}
                  />
                </TableCell>
                <TableCell>
                  <Button component={RouterLink} to={`/coaches/${coach.id}`} size="small">
                    Ver
                  </Button>
                  {canManage && (
                    <Button
                      component={RouterLink}
                      to={`/coaches/${coach.id}/edit`}
                      size="small"
                    >
                      Editar
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </DataTable>
        )}
      </Stack>
    </AppShell>
  )
}
