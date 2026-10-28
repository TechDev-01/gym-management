import { request } from '../../lib/http'
import type { Coach, CoachInput } from './types'

export function getCoaches(): Promise<Coach[]> {
  return request<Coach[]>('coaches')
}

export function getCoach(id: number): Promise<Coach> {
  return request<Coach>(`coaches/${id}`)
}

export function createCoach(input: CoachInput): Promise<Coach> {
  return request<Coach>('coaches', { method: 'POST', body: input })
}

export function updateCoach(id: number, input: CoachInput): Promise<Coach> {
  return request<Coach>(`coaches/${id}`, { method: 'PATCH', body: input })
}
