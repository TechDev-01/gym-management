import assert from 'node:assert/strict'
import { createServer, type Server } from 'node:http'
import { after, before, test } from 'node:test'

process.env.NODE_ENV = 'test'
process.env.DATABASE_URL = 'postgresql://user:password@localhost:5432/gym'
process.env.JWT_SECRET = 'test-secret-with-at-least-32-characters'
process.env.REDIS_URL = 'redis://localhost:6379'
process.env.STRIPE_SECRET_KEY = 'test-stripe-secret'
process.env.STRIPE_WEBHOOK_SECRET = 'test-webhook-secret'
process.env.RATE_LIMIT_MAX = '1'
process.env.RATE_LIMIT_WINDOW_MS = '60000'

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

function baseUrl(): string {
  const address = server.address()
  assert(address && typeof address === 'object')
  return `http://127.0.0.1:${address.port}`
}

test('global rate limiter rejects requests above the configured limit', async () => {
  const accepted = await fetch(`${baseUrl()}/api/v1/health`)
  assert.equal(accepted.status, 200)
  assert.equal(typeof accepted.headers.get('x-request-id'), 'string')

  const rejected = await fetch(`${baseUrl()}/api/v1/health`)
  assert.equal(rejected.status, 429)
  assert.equal(typeof rejected.headers.get('retry-after'), 'string')

  const body = await rejected.json()
  assert.equal(body.code, 'RATE_LIMITED')
  assert.equal(body.path, '/api/v1/health')
  assert.equal(typeof body.requestId, 'string')
})
