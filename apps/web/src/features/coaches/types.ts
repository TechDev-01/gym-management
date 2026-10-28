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
