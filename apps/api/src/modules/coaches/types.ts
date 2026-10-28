export interface CoachesHealthResponse {
  status: 'ok'
  module: 'coaches'
}

export interface CreateCoachInput {
  email: string
  dni: string
  name: string
  lastName: string
  phone: string
}

export interface CoachResponse {
  id: number
  email: string
  dni: string
  name: string
  lastName: string
  phone: string
  isActive: boolean
}

export interface UpdateCoachInput {
  email?: string
  dni?: string
  name?: string
  lastName?: string
  phone?: string
}
