import { request } from '../../lib/http'
import type { ProgressFilters, ProgressInput, ProgressPage, ProgressRecord } from './types'

function buildPath(filters: ProgressFilters): string {
  const searchParams = new URLSearchParams()

  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== '') {
      searchParams.set(key, String(value))
    }
  }

  const query = searchParams.toString()
  return query ? `progress?${query}` : 'progress'
}

export function getProgress(filters: ProgressFilters = {}): Promise<ProgressPage> {
  return request<ProgressPage>(buildPath(filters))
}

export function getProgressRecord(id: number): Promise<ProgressRecord> {
  return request<ProgressRecord>(`progress/${id}`)
}

export function createProgress(input: ProgressInput): Promise<ProgressRecord> {
  return request<ProgressRecord>('progress', { method: 'POST', body: input })
}
