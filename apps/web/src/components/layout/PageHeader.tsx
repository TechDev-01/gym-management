import { Box, Button, Stack, Typography } from '@mui/material'
import type { ReactNode } from 'react'

interface PageHeaderProps {
  eyebrow?: string
  title: string
  subtitle?: string
  actions?: ReactNode
}

export function PageHeader({ eyebrow, title, subtitle, actions }: PageHeaderProps) {
  return (
    <Box sx={{ display: 'flex', alignItems: { xs: 'flex-start', md: 'flex-end' }, justifyContent: 'space-between', gap: 2, mb: 3.75, flexDirection: { xs: 'column', md: 'row' } }}>
      <Box>
        {eyebrow && <Typography variant="overline" color="primary.light">{eyebrow}</Typography>}
        <Typography variant="h4" sx={{ fontSize: { xs: 23, md: 27 }, mt: 0.5 }}>{title}</Typography>
        {subtitle && <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>{subtitle}</Typography>}
      </Box>
      {actions && <Stack direction="row" spacing={1} sx={{ width: { xs: '100%', md: 'auto' } }}>{actions}</Stack>}
    </Box>
  )
}

