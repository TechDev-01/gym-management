import assert from 'node:assert/strict'
import { test } from 'node:test'
import { ClientsService } from '../../src/modules/clients/clients.service.js'
import type { ClientsRepository } from '../../src/modules/clients/clients.repository.js'
import type { Client } from '../../src/modules/clients/client.entity.js'

const input = {
  email: 'ana@example.com',
  dni: '12345678',
  name: 'Ana',
  lastName: 'Gomez',
  phone: '555-0100',
}

function createClientRepository(overrides: Partial<ClientsRepository> = {}): ClientsRepository {
  const client = {
    id: 1,
    ...input,
    isActive: true,
    createdAt: new Date(),
  } as Client

  return {
    getModuleName: () => 'clients',
    findByEmail: async () => null,
    findByDni: async () => null,
    create: async () => client,
    ...overrides,
  }
}

test('register rejects an existing email', async () => {
  const service = new ClientsService(
    createClientRepository({ findByEmail: async () => ({ } as Client) }),
  )

  await assert.rejects(() => service.register(input), {
    message: 'Email is already registered',
  })
})

test('register rejects an existing DNI', async () => {
  const service = new ClientsService(
    createClientRepository({ findByDni: async () => ({ } as Client) }),
  )

  await assert.rejects(() => service.register(input), {
    message: 'DNI is already registered',
  })
})

test('register creates and returns a client', async () => {
  const service = new ClientsService(createClientRepository())

  const result = await service.register(input)

  assert.equal(result.id, 1)
  assert.equal(result.email, input.email)
  assert.equal(result.isActive, true)
})
