import type { SVGProps } from 'react'

export type IconName =
  | 'dashboard'
  | 'clients'
  | 'membership'
  | 'attendance'
  | 'routine'
  | 'stats'
  | 'progress'
  | 'settings'
  | 'profile'
  | 'users'
  | 'money'
  | 'check'
  | 'add'
  | 'search'

interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'name' | 'size'> {
  name: IconName
  size?: number
  strokeWidth?: number
}

const paths: Record<IconName, string> = {
  dashboard: 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z',
  clients: 'M16 20v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 18.5V20M10 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM17 11a2.5 2.5 0 1 0 0-5M16 15h1.5A3.5 3.5 0 0 1 21 18.5V20',
  membership: 'M12 3 20 7.5v9L12 21l-8-4.5v-9L12 3ZM4.5 7.8 12 12l7.5-4.2M12 12v9',
  attendance: 'M7 3v4M17 3v4M4 9h16M6 5h12a2 2 0 0 1 2 2v12H4V7a2 2 0 0 1 2-2ZM8 13h3M8 17h3',
  routine: 'M6 4h12v16H6zM9 8h6M9 12h6M9 16h3',
  stats: 'M5 19V9M12 19V5M19 19V3',
  progress: 'M4 17 9 12l3 3 8-9M15 6h5v5',
  settings: 'M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM19 12a7 7 0 0 0-.1-1.2l2-1.5-2-3.4-2.3.9a7.5 7.5 0 0 0-2-1.2L14.3 3h-4.6l-.4 2.6a7.5 7.5 0 0 0-2 1.2L5 5.9 3 9.3l2 1.5A7 7 0 0 0 5 12c0 .4 0 .8.1 1.2l-2 1.5 2 3.4 2.3-.9a7.5 7.5 0 0 0 2 1.2l.4 2.6h4.6l.4-2.6a7.5 7.5 0 0 0 2-1.2l2.3.9 2-3.4-2-1.5c0-.4.1-.8.1-1.2Z',
  profile: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM5 21a7 7 0 0 1 14 0',
  users: 'M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM4 20v-1a4 4 0 0 1 4-4h1M15 11a3 3 0 1 0 0-6M15 15h1a4 4 0 0 1 4 4v1',
  money: 'M4 6h16v12H4zM8 12h.01M16 12h.01M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
  check: 'M5 12.5 9.5 17 19 7',
  add: 'M12 5v14M5 12h14',
  search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14ZM20 20l-4-4',
}

export function Icon({ name, size = 20, strokeWidth = 1.8, ...props }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={strokeWidth}
      {...props}
    >
      <path d={paths[name]} />
    </svg>
  )
}
