import type { ReactNode } from 'react'

export type UserRole = 'ADMIN' | 'RECEPTION' | 'COACH' | 'CLIENT'

export interface NavigationItem {
  label: string
  href: string
  icon: ReactNode
  roles: UserRole[]
  badge?: string
}

export interface NavigationSection {
  label: string
  items: NavigationItem[]
}

