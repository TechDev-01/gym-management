export const weekDays = [
  { value: 1, label: 'Lunes' },
  { value: 2, label: 'Martes' },
  { value: 3, label: 'Miércoles' },
  { value: 4, label: 'Jueves' },
  { value: 5, label: 'Viernes' },
  { value: 6, label: 'Sábado' },
  { value: 7, label: 'Domingo' },
] as const

export function weekDayLabel(dayOfWeek: number): string {
  return weekDays.find((day) => day.value === dayOfWeek)?.label ?? `Día ${dayOfWeek}`
}
