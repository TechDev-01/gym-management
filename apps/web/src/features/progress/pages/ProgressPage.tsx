import { Alert, Box, Button, Grid, Stack, TextField, Typography } from '@mui/material'
import { useState } from 'react'
import { EmptyState, ErrorState, LoadingState } from '../../../components/feedback/States'
import { AppShell } from '../../../components/layout/AppShell'
import { PageHeader } from '../../../components/layout/PageHeader'
import { Panel } from '../../../components/ui/Panel'
import { HttpError } from '../../../lib/http'
import { canViewProgress, useAuth } from '../../auth'
import type { Client } from '../../clients/types'
import { ProgressClientSelector } from '../components/ProgressClientSelector'
import { ProgressEvolutionChart } from '../components/ProgressEvolutionChart'
import { ProgressForm } from '../components/ProgressForm'
import { ProgressHistoryTable } from '../components/ProgressHistoryTable'
import { useProgress } from '../hooks'

const pageSize = 10

function errorMessage(error: unknown): string {
  return error instanceof HttpError || error instanceof Error
    ? error.message
    : 'No fue posible cargar el progreso.'
}

export function ProgressPage() {
  const { user } = useAuth()
  const isClient = user?.role === 'CLIENT'
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [page, setPage] = useState(1)
  const [message, setMessage] = useState<string | null>(null)
  const invalidRange = from !== '' && to !== '' && from > to
  const clientId = isClient ? user?.clientId ?? undefined : selectedClient?.id
  const hasClient = clientId !== undefined
  const progressQuery = useProgress(
    {
      clientId,
      from: from || undefined,
      to: to || undefined,
      page,
      limit: pageSize,
    },
    hasClient && !invalidRange,
  )

  const selectClient = (client: Client) => {
    setSelectedClient(client)
    setPage(1)
    setMessage(null)
  }

  const updateFrom = (value: string) => {
    setFrom(value)
    setPage(1)
  }

  const updateTo = (value: string) => {
    setTo(value)
    setPage(1)
  }

  if (!canViewProgress(user?.role)) {
    return (
      <AppShell>
        <ErrorState message="No tienes permiso para consultar el progreso." />
      </AppShell>
    )
  }

  if (isClient && !user?.clientId) {
    return (
      <AppShell>
        <ErrorState message="Tu usuario no tiene un cliente asociado para consultar el progreso." />
      </AppShell>
    )
  }

  const records = progressQuery.data?.items ?? []
  const total = progressQuery.data?.total ?? 0

  return (
    <AppShell>
      <PageHeader
        eyebrow={isClient ? 'Mi evolución' : 'Seguimiento'}
        title={isClient ? 'Mi progreso' : 'Progreso'}
        subtitle={
          isClient
            ? 'Registra tus mediciones y consulta tu evolución física.'
            : 'Registra mediciones y consulta la evolución física de tus clientes.'
        }
      />
      <Stack spacing={2}>
        {message && (
          <Alert severity="success" onClose={() => setMessage(null)}>
            {message}
          </Alert>
        )}

        <Grid container spacing={2}>
          {!isClient && (
            <Grid size={{ xs: 12, md: 5 }}>
              <ProgressClientSelector
                selectedClientId={selectedClient?.id ?? null}
                onSelect={selectClient}
              />
            </Grid>
          )}
          <Grid size={{ xs: 12, md: isClient ? 12 : 7 }}>
            <Panel
              title="Nueva medición"
              subtitle={
                selectedClient
                  ? `${selectedClient.name} ${selectedClient.lastName}`
                  : isClient
                    ? 'Tu historial personal'
                    : 'Selecciona un cliente para registrar mediciones'
              }
            >
              {hasClient ? (
                <Box sx={{ mt: 2 }}>
                  <ProgressForm
                    clientId={isClient ? undefined : clientId}
                    clientName={
                      selectedClient
                        ? `${selectedClient.name} ${selectedClient.lastName}`
                        : undefined
                    }
                    onSaved={() => setMessage('Medición registrada correctamente.')}
                  />
                </Box>
              ) : (
                <Box sx={{ mt: 2 }}>
                  <EmptyState message="Selecciona un cliente para registrar y consultar su progreso." />
                </Box>
              )}
            </Panel>
          </Grid>
        </Grid>

        {!hasClient && !isClient && (
          <EmptyState message="Selecciona un cliente para consultar su evolución." />
        )}

        {hasClient && (
          <>
            <Panel
              title="Evolución"
              subtitle="Compara una métrica a lo largo del tiempo."
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
                  <Button
                    variant="text"
                    onClick={() => {
                      setFrom('')
                      setTo('')
                      setPage(1)
                    }}
                  >
                    Limpiar
                  </Button>
                </Stack>
                {invalidRange && (
                  <Typography variant="body2" color="error">
                    La fecha inicial no puede ser posterior a la fecha final.
                  </Typography>
                )}
                {progressQuery.isLoading && <LoadingState label="Cargando evolución..." />}
                {progressQuery.isError && (
                  <ErrorState message={errorMessage(progressQuery.error)} />
                )}
                {progressQuery.isSuccess && <ProgressEvolutionChart records={records} />}
              </Stack>
            </Panel>

            <Panel title="Historial" subtitle="Mediciones registradas en el periodo.">
              <Stack spacing={2} sx={{ mt: 2 }}>
                {progressQuery.isLoading && <LoadingState label="Cargando historial..." />}
                {progressQuery.isError && (
                  <ErrorState message={errorMessage(progressQuery.error)} />
                )}
                {progressQuery.isSuccess && (
                  <ProgressHistoryTable
                    records={records}
                    total={total}
                    page={page}
                    pageSize={pageSize}
                    fetching={progressQuery.isFetching}
                    onPageChange={setPage}
                  />
                )}
              </Stack>
            </Panel>
          </>
        )}
      </Stack>
    </AppShell>
  )
}
