import express from 'express'
import { paymentWebhookHandler } from './modules/memberships/index.js'
import { v1Router } from './routes/v1/index.js'
import { errorHandlerMiddleware } from './shared/middlewares/error-handler.middleware.js'
import { notFoundMiddleware } from './shared/middlewares/not-found.middleware.js'

export const app = express()

app.post('/api/v1/payments/webhook', express.raw({ type: 'application/json' }), paymentWebhookHandler)
app.use(express.json())
app.use('/api/v1', v1Router)
app.use(notFoundMiddleware)
app.use(errorHandlerMiddleware)

export default app
