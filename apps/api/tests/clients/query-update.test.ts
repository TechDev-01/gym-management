import assert from 'node:assert/strict'
import express from 'express'
import { test } from 'node:test'
import { errorHandlerMiddleware } from '../../src/shared/middlewares/error-handler.middleware.js'
import { createClientsRouter } from '../../src/modules/clients/clients.routes.js'
import type { ClientsRepository } from '../../src/modules/clients/clients.repository.js'
import type { Client } from '../../src/modules/clients/client.entity.js'

function createRepository(includeDuplicate = false): ClientsRepository {
  let clients: Client[] = [
    {
      id: 1,
      email: 'ana@example.com',
      dni: '12345678',
      name: 'Ana',
      lastName: 'Gomez',
      phone: '555-0100',
      isActive: true,
      createdAt: new Date(),
    } as Client,
  ]
  if (includeDuplicate) {
    clients.push({
      ...clients[0],
      id: 2,
      email: 'beatriz@example.com',
      dni: '87654321',
    } as Client)
  }

  return {
    getModuleName: () => 'clients',
    findByEmail: async (email) => clients.find((client) => client.email === email) ?? null,
    findByDni: async (dni) => clients.find((client) => client.dni === dni) ?? null,
    create: async () => clients[0] as Client,
    getClients: async () => clients,
    getClient: async (id) => clients.find((client) => client.id === id) ?? null,
    updateClient: async (id, input) => {
      const index = clients.findIndex((client) => client.id === id)
      if (index < 0) {
        return null
      }

      clients[index] = { ...clients[index], ...input } as Client
      return clients[index]
    },
  }
}

async function request(
  path: string,
  init?: RequestInit,
  repository: ClientsRepository = createRepository(),
): Promise<Response> {
  const app = express()
  app.use(express.json())
  app.use('/clients', createClientsRouter(repository))
  app.use(errorHandlerMiddleware)
  const server = app.listen(0)
  const address = server.address()
  assert(address && typeof address === 'object')

  try {
    return await fetch(`http://127.0.0.1:${address.port}${path}`, init)
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()))
    })
  }
}

test('GET /clients returns an array of clients', async () => {
  const response = await request('/clients')

  assert.equal(response.status, 200)
  assert.equal((await response.json()).length, 1)
})

test('GET /clients/:id returns the requested client', async () => {
  const response = await request('/clients/1')

  assert.equal(response.status, 200)
  assert.equal((await response.json()).id, 1)
})

test('GET /clients/:id returns 404 for an unknown client', async () => {
  const response = await request('/clients/99')

  assert.equal(response.status, 404)
  assert.deepEqual(await response.json(), { error: 'Client not found' })
})

test('GET /clients/:id returns 400 for an invalid id', async () => {
  const response = await request('/clients/not-a-number')

  assert.equal(response.status, 400)
})

test('PATCH /clients/:id updates the client', async () => {
  const response = await request('/clients/1', {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ name: 'Beatriz' }),
  })

  assert.equal(response.status, 200)
  assert.equal((await response.json()).name, 'Beatriz')
})

test('PATCH /clients/:id returns 409 for a duplicate email', async () => {
  const response = await request('/clients/1', {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: 'beatriz@example.com' }),
  }, createRepository(true))

  assert.equal(response.status, 409)
})

test('PATCH /clients/:id rejects an empty body', async () => {
  const response = await request('/clients/1', {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({}),
  })

  assert.equal(response.status, 400)
})
