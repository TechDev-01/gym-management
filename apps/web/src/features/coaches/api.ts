import { request } from '../../lib/http'
import type { Coach, CoachInput, CoachSchedule, CoachScheduleInput } from './types'

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

export function getCoachSchedules(coachId: number): Promise<CoachSchedule[]> {
  return request<CoachSchedule[]>(`coaches/${coachId}/schedules`)
}

export function createCoachSchedule(
  coachId: number,
  input: CoachScheduleInput,
): Promise<CoachSchedule> {
  return request<CoachSchedule>(`coaches/${coachId}/schedules`, {
    method: 'POST',
    body: input,
  })
}

export function updateCoachSchedule(
  coachId: number,
  scheduleId: number,
  input: Partial<CoachScheduleInput>,
): Promise<CoachSchedule> {
  return request<CoachSchedule>(
    `coaches/${coachId}/schedules/${scheduleId}`,
    { method: 'PATCH', body: input },
  )
}

export function deleteCoachSchedule(
  coachId: number,
  scheduleId: number,
): Promise<void> {
  return request<void>(`coaches/${coachId}/schedules/${scheduleId}`, {
    method: 'DELETE',
  })
}
