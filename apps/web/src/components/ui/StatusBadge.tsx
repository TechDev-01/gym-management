import { Chip } from '@mui/material'

interface StatusBadgeProps {
  label: string
  status: 'success' | 'pending' | 'error' | 'info'
}

export function StatusBadge({ label, status }: StatusBadgeProps) {
  return <Chip size="small" label={label} color={status === 'pending' ? 'warning' : status} />
}

