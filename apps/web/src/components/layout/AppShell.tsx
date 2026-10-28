import { AppBar, Badge, Box, Drawer, IconButton, InputAdornment, TextField, Toolbar, Typography } from '@mui/material'
import { useState, type ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import type { UserRole } from '../../types/navigation'
import { useAuth } from '../../features/auth'

interface AppShellProps {
  children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const { user } = useAuth()
  const role: UserRole = user?.role ?? 'CLIENT'
  const [drawerOpen, setDrawerOpen] = useState(false)

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <Sidebar role={role} variant="permanent" />
      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        sx={{ display: { xs: 'block', md: 'none' } }}
        slotProps={{ paper: { sx: { width: 248, bgcolor: '#0a0e17' } } }}
      >
        <Sidebar role={role} onNavigate={() => setDrawerOpen(false)} />
      </Drawer>
      <Box sx={{ display: 'flex', flex: 1, minWidth: 0, flexDirection: 'column' }}>
        <AppBar position="static" color="transparent" elevation={0} sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'background.topbar' }}>
          <Toolbar sx={{ gap: 1.5, minHeight: { xs: 62, md: 72 }, px: { xs: 2, md: 5 } }}>
            <IconButton onClick={() => setDrawerOpen(true)} sx={{ display: { md: 'none' }, color: 'text.secondary' }} aria-label="Abrir menú">
              ☰
            </IconButton>
            <TextField
              size="small"
              placeholder="Buscar clientes, rutinas..."
              aria-label="Buscar"
              sx={{ width: { xs: '100%', sm: 275 }, '& .MuiOutlinedInput-root': { bgcolor: 'background.paper' } }}
              slotProps={{ input: { startAdornment: <InputAdornment position="start">⌕</InputAdornment> } }}
            />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, md: 3 }, ml: 'auto' }}>
              <IconButton aria-label="Notificaciones" sx={{ color: 'text.secondary' }}>
                <Badge color="error" variant="dot">
                  ♢
                </Badge>
              </IconButton>
              <Typography variant="caption" sx={{ display: { xs: 'none', sm: 'block' }, color: 'text.secondary' }}>
                Martes, 27 de octubre de 2026
              </Typography>
            </Box>
          </Toolbar>
        </AppBar>
        <Box component="main" sx={{ width: '100%', maxWidth: 1440, mx: 'auto', flex: 1, p: { xs: 2, md: 5 } }}>
          {children}
        </Box>
      </Box>
    </Box>
  )
}
