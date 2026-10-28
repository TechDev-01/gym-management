import { request } from '../../lib/http'
import type { Client, ClientInput, ClientUpdateInput } from './types'

export function getClients(): Promise<Client[]> {
  return request<Client[]>('clients')
}

export function getClient(id: number): Promise<Client> {
  return request<Client>(`clients/${id}`)
}

export function createClient(input: ClientInput): Promise<Client> {
  return request<Client>('clients', { method: 'POST', body: input })
}

export function updateClient(id: number, input: ClientUpdateInput): Promise<Client> {
  return request<Client>(`clients/${id}`, { method: 'PATCH', body: input })
}
