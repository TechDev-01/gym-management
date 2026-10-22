import assert from 'node:assert/strict'
import { test } from 'node:test'
import { ZodError } from 'zod'
import { ClientsService } from '../../src/modules/clients/clients.service.js'
import type { ClientsRepository } from '../../src/modules/clients/clients.repository.js'
import type { Client } from '../../src/modules/clients/client.entity.js'

function client(overrides: Partial<Client> = {}): Client {
  return {
    id: 1,
    email: 'ana@example.com',
    dni: '12345678',
    name: 'Ana',
    lastName: 'Gomez',
    phone: '555-0100',
    isActive: true,
    createdAt: new Date(),
    ...overrides,
  } as Client
}

function repository(initialClient = client()): ClientsRepository {
  let currentClient: Client | null = initialClient

  return {
    getModuleName: () => 'clients',
    findByEmail: async (email) =>
      currentClient?.email === email ? currentClient : null,
    findByDni: async (dni) => (currentClient?.dni === dni ? currentClient : null),
    create: async () => currentClient as Client,
    getClients: async () => (currentClient ? [currentClient] : []),
    getClient: async () => currentClient,
    updateClient: async (_id, input) => {
      currentClient = currentClient ? client({ ...currentClient, ...input }) : null
      return currentClient
    },
  }
}

test('getClients returns all clients', async () => {
  const service = new ClientsService(repository())

  const result = await service.getClients()

  assert.equal(result.length, 1)
  assert.equal(result[0]?.email, 'ana@example.com')
})

test('getClient throws when the client does not exist', async () => {
  const service = new ClientsService(repository(null))

  await assert.rejects(() => service.getClient(1), {
    message: 'Client not found',
  })
})

test('updateClient updates allowed fields', async () => {
  const service = new ClientsService(repository())

  const result = await service.updateClient(1, { name: 'Beatriz' })

  assert.equal(result.name, 'Beatriz')
})

test('updateClient rejects a duplicate email', async () => {
  const existing = client()
  const duplicate = client({ id: 2, email: 'other@example.com' })
  const clientRepository = repository(existing)
  clientRepository.findByEmail = async (email) =>
    email === 'other@example.com' ? duplicate : null
  const service = new ClientsService(clientRepository)

  await assert.rejects(
    () => service.updateClient(1, { email: 'other@example.com' }),
    { message: 'Email is already registered' },
  )
})

test('updateClient rejects an empty body', async () => {
  const service = new ClientsService(repository())

  await assert.rejects(
    () => service.updateClient(1, {}),
    (error: unknown) =>
      error instanceof ZodError &&
      error.issues[0]?.message === 'At least one field is required',
  )
})
