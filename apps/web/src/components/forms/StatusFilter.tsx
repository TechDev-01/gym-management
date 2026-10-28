import { MenuItem, TextField } from '@mui/material'

export type StatusFilterValue = 'all' | 'active' | 'inactive'

interface StatusFilterProps {
  value: StatusFilterValue
  onChange: (value: StatusFilterValue) => void
  label?: string
}

export function StatusFilter({
  value,
  onChange,
  label = 'Estado',
}: StatusFilterProps) {
  return (
    <TextField
      select
      size="small"
      label={label}
      value={value}
      onChange={(event) => onChange(event.target.value as StatusFilterValue)}
      sx={{ minWidth: { sm: 180 } }}
    >
      <MenuItem value="all">Todos</MenuItem>
      <MenuItem value="active">Activos</MenuItem>
      <MenuItem value="inactive">Inactivos</MenuItem>
    </TextField>
  )
}
