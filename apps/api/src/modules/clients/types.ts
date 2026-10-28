export interface ClientsHealthResponse {
  status: 'ok'
  module: 'clients'
}
export interface CreateClientInput {
  email: string
  password?: string
  dni: string
  name: string
  lastName: string
  phone: string
}

export interface ClientResponse {
  id: number
  email: string
  dni: string
  name: string
  lastName: string
  phone: string
  isActive: boolean
  createdAt: Date
}

export interface UpdateClientInput {
  email?: string
  dni?: string
  name?: string
  lastName?: string
  phone?: string
}
