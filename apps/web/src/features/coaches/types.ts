export interface Coach {
  id: number
  email: string
  dni: string
  name: string
  lastName: string
  phone: string
  isActive: boolean
}

export interface CoachInput {
  email: string
  dni: string
  name: string
  lastName: string
  phone: string
}

export interface CoachSchedule {
  id: number
  coachId: number
  dayOfWeek: number
  startTime: string
  endTime: string
}

export interface CoachScheduleInput {
  dayOfWeek: number
  startTime: string
  endTime: string
}
