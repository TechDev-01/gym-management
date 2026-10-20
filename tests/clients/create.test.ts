import assert from 'node:assert/strict'
import express from 'express'
import { test } from 'node:test'
import { createClientsRouter } from '../../src/modules/clients/clients.routes.js'
import type { ClientsRepository } from '../../src/modules/clients/clients.repository.js'
import type { Client } from '../../src/modules/clients/client.entity.js'
import { errorHandlerMiddleware } from '../../src/shared/middlewares/error-handler.middleware.js'

const input = {
  email: 'ana@example.com',
  dni: '12345678',
  name: 'Ana',
  lastName: 'Gomez',
  phone: '555-0100',
}

function createApp(repository: ClientsRepository) {
  const app = express()
  app.use(express.json())
  app.use('/clients', createClientsRouter(repository))
  app.use(errorHandlerMiddleware)
  return app
}

function createRepository(): ClientsRepository {
  return {
    getModuleName: () => 'clients',
    findByEmail: async () => null,
    findByDni: async () => null,
    create: async (clientInput) => ({
      id: 1,
      ...clientInput,
      isActive: true,
      createdAt: new Date(),
    } as Client),
  }
}

async function request(
  repository: ClientsRepository,
  body: unknown,
): Promise<{ status: number; body: unknown }> {
  const app = createApp(repository)
  const server = app.listen(0)
  const address = server.address()
  assert(address && typeof address === 'object')

  try {
    const response = await fetch(`http://127.0.0.1:${address.port}/clients`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    })

    return { status: response.status, body: await response.json() }
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()))
    })
  }
}

test('POST /clients returns 201 for valid input', async () => {
  const result = await request(createRepository(), input)

  assert.equal(result.status, 201)
  assert.deepEqual(result.body, {
    id: 1,
    ...input,
    isActive: true,
    createdAt: (result.body as { createdAt: string }).createdAt,
  })
})

test('POST /clients returns 400 for invalid input', async () => {
  const result = await request(createRepository(), { ...input, email: 'invalid' })

  assert.equal(result.status, 400)
})

test('POST /clients returns 409 for a duplicate email', async () => {
  const repository = createRepository()
  repository.findByEmail = async () => ({ } as Client)
  const result = await request(repository, input)

  assert.equal(result.status, 409)
})

test('POST /clients returns 409 for a duplicate DNI', async () => {
  const repository = createRepository()
  repository.findByDni = async () => ({ } as Client)
  const result = await request(repository, input)

  assert.equal(result.status, 409)
})
