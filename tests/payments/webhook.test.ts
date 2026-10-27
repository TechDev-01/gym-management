import assert from 'node:assert/strict'
import express from 'express'
import { test } from 'node:test'
import type { PaymentsService } from '../../src/modules/payments/payments.service.js'
import { PaymentsController } from '../../src/modules/payments/payments.controller.js'
import { createPaymentsRouter } from '../../src/modules/payments/payments.routes.js'
import { errorHandlerMiddleware } from '../../src/shared/middlewares/error-handler.middleware.js'

async function request(service: PaymentsService, body: string, signature?: string): Promise<Response> {
  const app = express()
  app.use('/payments', createPaymentsRouter(new PaymentsController(service)))
  app.use(errorHandlerMiddleware)
  const server = app.listen(0)
  const address = server.address()
  assert(address && typeof address === 'object')

  try {
    return await fetch(`http://127.0.0.1:${address.port}/payments/webhook`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(signature ? { 'stripe-signature': signature } : {}),
      },
      body,
    })
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()))
    })
  }
}

test('webhook rejects missing signature while preserving the raw body contract', async () => {
  const calls: Array<{ payload: Buffer; signature: string }> = []
  const service = {
    handleWebhook: async (payload: Buffer, signature: string) => {
      calls.push({ payload, signature })
    },
  } as PaymentsService

  const missingSignature = await request(service, '{"id":"evt_1"}')
  assert.equal(missingSignature.status, 409)
  assert.deepEqual(await missingSignature.json(), { error: 'Stripe signature or raw body is missing' })
  assert.equal(calls.length, 0)

  const accepted = await request(service, '{"id":"evt_2"}', 'valid-signature')
  assert.equal(accepted.status, 200)
  assert.deepEqual(await accepted.json(), { received: true })
  assert.equal(calls[0]?.payload.toString(), '{"id":"evt_2"}')
  assert.equal(calls[0]?.signature, 'valid-signature')
})
