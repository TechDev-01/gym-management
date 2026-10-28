export interface Client {
  id: number
  email: string
  dni: string
  name: string
  lastName: string
  phone: string
  isActive: boolean
  createdAt: string
}

export interface ClientInput {
  email: string
  password?: string
  dni: string
  name: string
  lastName: string
  phone: string
}

export interface ClientUpdateInput {
  email?: string
  dni?: string
  name?: string
  lastName?: string
  phone?: string
}
