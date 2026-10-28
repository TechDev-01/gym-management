import { Button, Stack, Typography } from '@mui/material'
import { useMemo, useState } from 'react'
import { EmptyState, ErrorState, LoadingState } from '../../../components/feedback/States'
import { SearchField } from '../../../components/forms/SearchField'
import { Panel } from '../../../components/ui/Panel'
import { StatusBadge } from '../../../components/ui/StatusBadge'
import { HttpError } from '../../../lib/http'
import type { Client } from '../../clients/types'
import { useClients } from '../../clients/hooks'

interface AttendanceClientSearchProps {
  selectedClientId: number | null
  onSelect: (client: Client) => void
}

function errorMessage(error: unknown): string {
  return error instanceof HttpError || error instanceof Error
    ? error.message
    : 'No fue posible cargar los clientes.'
}

export function AttendanceClientSearch({
  selectedClientId,
  onSelect,
}: AttendanceClientSearchProps) {
  const clientsQuery = useClients()
  const [search, setSearch] = useState('')

  const clients = useMemo(() => {
    const normalized = search.trim().toLowerCase()

    return (clientsQuery.data ?? [])
      .filter((client) => {
        if (!normalized) {
          return client.isActive
        }

        return `${client.name} ${client.lastName} ${client.email} ${client.dni}`
          .toLowerCase()
          .includes(normalized)
      })
      .sort((left, right) => {
        if (left.isActive !== right.isActive) {
          return left.isActive ? -1 : 1
        }

        return `${left.name} ${left.lastName}`.localeCompare(`${right.name} ${right.lastName}`)
      })
      .slice(0, 8)
  }, [clientsQuery.data, search])

  return (
    <Panel
      title="Registro rápido"
      subtitle={
        search.trim()
          ? 'Selecciona al cliente que desea registrar su entrada.'
          : 'Clientes activos listos para check-in.'
      }
    >
      <Stack spacing={1.5} sx={{ mt: 2 }}>
        <SearchField
          value={search}
          onChange={setSearch}
          placeholder="Buscar por nombre, correo o DNI"
          label="Buscar cliente para registrar entrada"
        />
        {clientsQuery.isLoading && <LoadingState label="Cargando clientes..." />}
        {clientsQuery.isError && <ErrorState message={errorMessage(clientsQuery.error)} />}
        {clientsQuery.isSuccess && clients.length === 0 && (
          <EmptyState
            message={
              search.trim()
                ? 'No hay clientes que coincidan con la búsqueda.'
                : 'No hay clientes activos para registrar asistencia.'
            }
          />
        )}
        {clientsQuery.isSuccess && clients.length > 0 && (
          <Stack spacing={1}>
            {clients.map((client) => {
              const selected = client.id === selectedClientId

              return (
                <Button
                  key={client.id}
                  variant={selected ? 'contained' : 'outlined'}
                  color={selected ? 'primary' : 'inherit'}
                  fullWidth
                  aria-label={`Seleccionar ${client.name} ${client.lastName}`}
                  onClick={() => onSelect(client)}
                  sx={{
                    justifyContent: 'flex-start',
                    py: 1.25,
                    px: 1.5,
                    textAlign: 'left',
                    borderColor: selected ? undefined : 'divider',
                  }}
                >
                  <Stack
                    sx={{
                      alignItems: 'flex-start',
                      gap: 0.25,
                      width: '100%',
                    }}
                  >
                    <Stack
                      sx={{
                        alignItems: 'center',
                        flexDirection: 'row',
                        gap: 1,
                        justifyContent: 'space-between',
                        width: '100%',
                      }}
                    >
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {client.name} {client.lastName}
                      </Typography>
                      <StatusBadge
                        label={client.isActive ? 'Activo' : 'Inactivo'}
                        status={client.isActive ? 'success' : 'error'}
                      />
                    </Stack>
                    <Typography variant="caption" color="text.secondary">
                      {client.dni} · {client.email}
                    </Typography>
                  </Stack>
                </Button>
              )
            })}
          </Stack>
        )}
        {!search.trim() && clientsQuery.isSuccess && (
          <Typography variant="caption" color="text.secondary">
            Escribe para buscar entre todos los clientes.
          </Typography>
        )}
      </Stack>
    </Panel>
  )
}
