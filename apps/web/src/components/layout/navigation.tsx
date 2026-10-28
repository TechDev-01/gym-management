import type { NavigationSection, UserRole } from '../../types/navigation'
import { Icon, type IconName } from '../ui/Icon'

function navigationIcon(name: IconName) {
  return <Icon name={name} />
}

export const navigationSections: NavigationSection[] = [
  {
    label: 'Workspace',
    items: [
      { label: 'Dashboard', href: '/dashboard', icon: navigationIcon('dashboard'), roles: ['ADMIN', 'RECEPTION', 'COACH', 'CLIENT'] },
      { label: 'Clientes', href: '/clients', icon: navigationIcon('clients'), roles: ['ADMIN', 'RECEPTION', 'COACH'] },
      { label: 'Entrenadores', href: '/coaches', icon: navigationIcon('profile'), roles: ['ADMIN', 'RECEPTION', 'COACH'] },
      { label: 'Membresías', href: '/memberships', icon: navigationIcon('membership'), roles: ['ADMIN', 'RECEPTION', 'CLIENT'] },
      { label: 'Suscripciones', href: '/subscriptions', icon: navigationIcon('subscriptions'), roles: ['ADMIN', 'RECEPTION', 'CLIENT'] },
      { label: 'Pagos', href: '/payments', icon: navigationIcon('payment'), roles: ['ADMIN', 'RECEPTION'] },
      { label: 'Asistencia', href: '/attendance', icon: navigationIcon('attendance'), roles: ['ADMIN', 'RECEPTION', 'COACH', 'CLIENT'] },
      { label: 'Rutinas', href: '/routines', icon: navigationIcon('routine'), roles: ['ADMIN', 'COACH', 'CLIENT'] },
      { label: 'Estadísticas', href: '/stats', icon: navigationIcon('stats'), roles: ['ADMIN'] },
      { label: 'Progreso', href: '/progress', icon: navigationIcon('progress'), roles: ['ADMIN', 'COACH', 'CLIENT'] },
    ],
  },
  {
    label: 'Sistema',
    items: [
      { label: 'Configuración', href: '/settings', icon: navigationIcon('settings'), roles: ['ADMIN'] },
      { label: 'Mi perfil', href: '/profile', icon: navigationIcon('profile'), roles: ['RECEPTION', 'COACH', 'CLIENT'] },
    ],
  },
]

export function getNavigationForRole(role: UserRole): NavigationSection[] {
  return navigationSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => item.roles.includes(role)),
    }))
    .filter((section) => section.items.length > 0)
}
