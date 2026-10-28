import { Avatar, Box, ButtonBase, Divider, List, ListItemButton, ListItemIcon, ListItemText, Stack, Typography } from '@mui/material'
import { Link, useLocation } from 'react-router-dom'
import { getNavigationForRole } from './navigation'
import type { UserRole } from '../../types/navigation'
import { useAuth } from '../../features/auth'

interface SidebarProps {
  role: UserRole
  variant?: 'permanent'
  onNavigate?: () => void
}

export function Sidebar({ role, variant, onNavigate }: SidebarProps) {
  const { user, logout } = useAuth()
  const location = useLocation()
  const sections = getNavigationForRole(role)

  return (
    <Box
      component="aside"
      sx={{
        display: { xs: variant ? 'none' : 'flex', md: variant ? 'flex' : 'none' },
        flexDirection: 'column',
        width: 248,
        flexShrink: 0,
        bgcolor: '#0a0e17',
        color: 'text.secondary',
        p: 2,
        pt: 3.5,
      }}
    >
      <Typography variant="h6" sx={{ color: 'common.white', fontWeight: 700, px: 1.5, mb: 4.5 }}>
        <Box component="span" sx={{ display: 'inline-grid', placeItems: 'center', width: 31, height: 31, mr: 1, bgcolor: 'primary.main', borderRadius: 0.75, verticalAlign: 'middle' }}>G</Box>
        Gym<Box component="span" sx={{ color: 'primary.light', display: 'inline' }}>Flow</Box>
      </Typography>
      <Box component="nav" aria-label="Navegación principal">
        {sections.map((section) => (
          <Box key={section.label} sx={{ mb: 3 }}>
            <Typography variant="overline" sx={{ color: 'text.disabled', px: 1.5, letterSpacing: 1.2 }}>
              {section.label}
            </Typography>
            <List disablePadding>
              {section.items.map((item) => {
                const active = location.pathname === item.href
                return (
                  <ListItemButton
                    key={item.href}
                    component={Link}
                    to={item.href}
                    onClick={onNavigate}
                    selected={active}
                    sx={{ minHeight: 42, borderRadius: 0.75, my: 0.35, gap: 1.25, '&.Mui-selected': { bgcolor: 'primary.dark', color: 'common.white', boxShadow: 'inset 3px 0 #9c6cff' } }}
                  >
                    <ListItemIcon sx={{ minWidth: 20, color: active ? 'primary.light' : 'text.secondary', fontSize: 18 }}>{item.icon}</ListItemIcon>
                    <ListItemText primary={item.label} />
                    {item.badge && <Typography variant="caption" sx={{ bgcolor: 'action.hover', px: 0.75, borderRadius: 1 }}>{item.badge}</Typography>}
                  </ListItemButton>
                )
              })}
            </List>
          </Box>
        ))}
      </Box>
      <Box sx={{ mt: 'auto' }}>
        <Stack spacing={0.5} sx={{ bgcolor: 'background.paper', border: 1, borderColor: 'divider', p: 1.75, mb: 2, borderRadius: 0.75 }}>
          <Typography sx={{ color: 'primary.light', bgcolor: 'primary.dark', borderRadius: '50%', width: 24, height: 24, textAlign: 'center', lineHeight: '24px', fontWeight: 700 }}>?</Typography>
          <Typography variant="caption" sx={{ color: 'text.primary', fontWeight: 600 }}>¿Necesitas ayuda?</Typography>
          <Typography variant="caption" color="text.secondary">Consulta la documentación</Typography>
        </Stack>
        <Divider sx={{ borderColor: 'divider' }} />
        <ButtonBase onClick={logout} sx={{ width: '100%', justifyContent: 'flex-start', gap: 1.25, py: 1.25, textAlign: 'left' }}>
          <Avatar sx={{ width: 34, height: 34, fontSize: 10, bgcolor: 'primary.main' }}>AR</Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="caption" sx={{ display: 'block', fontWeight: 600 }}>{user?.email ?? 'Usuario'}</Typography>
            <Typography variant="caption" color="text.secondary">{role}</Typography>
          </Box>
          <Typography sx={{ color: 'text.disabled' }} aria-label="Cerrar sesión">↪</Typography>
        </ButtonBase>
      </Box>
    </Box>
  )
}
