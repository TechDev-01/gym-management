import assert from 'node:assert/strict'
import { createServer, type Server } from 'node:http'
import { after, before, test } from 'node:test'

process.env.NODE_ENV = 'test'
process.env.DATABASE_URL = 'postgresql://user:password@localhost:5432/gym'
process.env.JWT_SECRET = 'test-secret-with-at-least-32-characters'
process.env.REDIS_URL = 'redis://localhost:6379'
process.env.STRIPE_SECRET_KEY = 'test-stripe-secret'
process.env.STRIPE_WEBHOOK_SECRET = 'test-webhook-secret'

let server: Server

before(async () => {
  const { app } = await import('../../src/app.js')
  server = createServer(app)

  await new Promise<void>((resolve) => {
    server.listen(0, resolve)
  })
})

after(async () => {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()))
  })
})

test('GET /api/v1/clients/health returns the clients module status', async () => {
  const address = server.address()
  assert(address && typeof address === 'object')

  const response = await fetch(`http://127.0.0.1:${address.port}/api/v1/clients/health`)

  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), { status: 'ok', module: 'clients' })
})
