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
import { canManageClients, useAuth } from '../../auth'
import { useClients } from '../hooks'

function errorMessage(error: unknown): string {
  return error instanceof HttpError || error instanceof Error
    ? error.message
    : 'No fue posible cargar los clientes.'
}

export function ClientsPage() {
  const { user } = useAuth()
  const clientsQuery = useClients()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<StatusFilterValue>('all')
  const canManage = canManageClients(user?.role)
  const clients = useMemo(() => {
    const normalized = search.trim().toLowerCase()

    return (clientsQuery.data ?? []).filter((client) => {
      const matchesSearch =
        !normalized ||
        `${client.name} ${client.lastName} ${client.email} ${client.dni} ${client.phone}`
          .toLowerCase()
          .includes(normalized)
      const matchesStatus =
        status === 'all' ||
        (status === 'active' ? client.isActive : !client.isActive)

      return matchesSearch && matchesStatus
    })
  }, [clientsQuery.data, search, status])
  const total = clientsQuery.data?.length ?? 0

  return (
    <AppShell>
      <PageHeader
        eyebrow="Gestión"
        title="Clientes"
        subtitle="Consulta y administra los perfiles de tus clientes."
        actions={
          canManage ? (
            <Button
              component={RouterLink}
              to="/clients/new"
              variant="contained"
              startIcon={<Icon name="add" size={18} />}
            >
              Nuevo cliente
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
            label="Buscar clientes"
          />
          <StatusFilter value={status} onChange={setStatus} />
        </Stack>
        {clientsQuery.isLoading && <LoadingState label="Cargando clientes..." />}
        {clientsQuery.isError && <ErrorState message={errorMessage(clientsQuery.error)} />}
        {clientsQuery.isSuccess && (
          <Typography variant="caption" color="text.secondary">
            {clients.length} de {total} clientes
          </Typography>
        )}
        {clientsQuery.isSuccess && clients.length === 0 && (
          <EmptyState
            message={
              search || status !== 'all'
                ? 'No hay clientes que coincidan con los filtros.'
                : 'No hay clientes registrados.'
            }
          />
        )}
        {clientsQuery.isSuccess && clients.length > 0 && (
          <DataTable headers={['CLIENTE', 'CONTACTO', 'DNI', 'ESTADO', 'ACCIONES']} minWidth={760}>
            {clients.map((client) => (
              <TableRow key={client.id} hover>
                <TableCell>
                  {client.name} {client.lastName}
                </TableCell>
                <TableCell>
                  {client.email}
                  <br />
                  {client.phone}
                </TableCell>
                <TableCell>{client.dni}</TableCell>
                <TableCell>
                  <StatusBadge
                    label={client.isActive ? 'Activo' : 'Inactivo'}
                    status={client.isActive ? 'success' : 'error'}
                  />
                </TableCell>
                <TableCell>
                  <Button component={RouterLink} to={`/clients/${client.id}`} size="small">
                    Ver
                  </Button>
                  {canManage && (
                    <Button
                      component={RouterLink}
                      to={`/clients/${client.id}/edit`}
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
