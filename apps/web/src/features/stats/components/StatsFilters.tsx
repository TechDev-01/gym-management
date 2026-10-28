import { Button, MenuItem, Stack, TextField } from '@mui/material'

export type StatsPeriod = '7' | '30' | '90' | 'custom'

interface StatsFiltersProps {
  period: StatsPeriod
  from: string
  to: string
  invalidRange: boolean
  isFetching: boolean
  onPeriodChange: (period: StatsPeriod) => void
  onFromChange: (value: string) => void
  onToChange: (value: string) => void
  onRefresh: () => void
}

export function StatsFilters({
  period,
  from,
  to,
  invalidRange,
  isFetching,
  onPeriodChange,
  onFromChange,
  onToChange,
  onRefresh,
}: StatsFiltersProps) {
  return (
    <Stack
      sx={{
        flexDirection: { xs: 'column', md: 'row' },
        alignItems: { xs: 'stretch', md: 'center' },
        gap: 1.5,
      }}
    >
      <TextField
        select
        size="small"
        label="Periodo"
        value={period}
        onChange={(event) => onPeriodChange(event.target.value as StatsPeriod)}
        sx={{ minWidth: 190 }}
      >
        <MenuItem value="7">Últimos 7 días</MenuItem>
        <MenuItem value="30">Últimos 30 días</MenuItem>
        <MenuItem value="90">Últimos 90 días</MenuItem>
        <MenuItem value="custom">Rango personalizado</MenuItem>
      </TextField>
      <TextField
        type="date"
        size="small"
        label="Desde"
        value={from}
        onChange={(event) => onFromChange(event.target.value)}
        error={invalidRange}
        slotProps={{ inputLabel: { shrink: true } }}
        sx={{ flex: 1 }}
      />
      <TextField
        type="date"
        size="small"
        label="Hasta"
        value={to}
        onChange={(event) => onToChange(event.target.value)}
        error={invalidRange}
        slotProps={{ inputLabel: { shrink: true } }}
        sx={{ flex: 1 }}
      />
      <Button variant="outlined" onClick={onRefresh} disabled={isFetching}>
        {isFetching ? 'Actualizando...' : 'Actualizar'}
      </Button>
    </Stack>
  )
}
