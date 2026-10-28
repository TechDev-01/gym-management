import { Card, CardContent, Chip, Stack, Typography } from '@mui/material'
import type { ReactNode } from 'react'

interface KpiCardProps {
  icon: ReactNode
  color: 'primary' | 'warning' | 'info' | 'success'
  trend: string
  label: string
  value: string
  detail: string
  warning?: boolean
}

export function KpiCard({ icon, color, trend, label, value, detail, warning }: KpiCardProps) {
  return (
    <Card>
      <CardContent>
        <Stack sx={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Stack sx={{ bgcolor: `${color}.dark`, color: `${color}.light`, p: 1, borderRadius: 0.75 }}>{icon}</Stack>
          <Chip size="small" label={trend} color={warning ? 'warning' : 'success'} />
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>{label}</Typography>
        <Typography variant="h5" sx={{ mt: 0.5 }}>{value}</Typography>
        <Typography variant="caption" color="text.disabled">{detail}</Typography>
      </CardContent>
    </Card>
  )
}
