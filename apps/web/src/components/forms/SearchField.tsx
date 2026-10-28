import { InputAdornment, TextField } from '@mui/material'
import { Icon } from '../ui/Icon'

interface SearchFieldProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  label?: string
}

export function SearchField({
  value,
  onChange,
  placeholder = 'Buscar...',
  label,
}: SearchFieldProps) {
  return (
    <TextField
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      label={label}
      size="small"
      fullWidth
      slotProps={{
        input: {
          startAdornment: (
            <InputAdornment position="start">
              <Icon name="search" size={18} />
            </InputAdornment>
          ),
        },
      }}
    />
  )
}
