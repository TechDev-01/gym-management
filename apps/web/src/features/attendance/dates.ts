export function todayDateString(date = new Date()): string {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
  return local.toISOString().slice(0, 10)
}

export function formatDuration(
  checkInAt: string,
  checkOutAt: string | null,
  now = new Date(),
): string {
  const start = new Date(checkInAt).getTime()
  const end = checkOutAt ? new Date(checkOutAt).getTime() : now.getTime()

  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) {
    return '—'
  }

  const minutes = Math.round((end - start) / 60_000)
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60

  if (hours === 0) {
    return `${minutes} min`
  }

  return remainingMinutes === 0 ? `${hours} h` : `${hours} h ${remainingMinutes} min`
}
