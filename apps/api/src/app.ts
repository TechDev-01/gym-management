import express from 'express'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import swaggerUi from 'swagger-ui-express'
import { env } from './config/env.js'
import { paymentsRouter } from './modules/payments/index.js'
import { v1Router } from './routes/v1/index.js'
import { openapiDocument } from './docs/openapi.js'
import { errorHandlerMiddleware } from './shared/middlewares/error-handler.middleware.js'
import { notFoundMiddleware } from './shared/middlewares/not-found.middleware.js'
import { globalRateLimiter } from './shared/middlewares/rate-limit.middleware.js'
import { requestIdMiddleware } from './shared/middlewares/request-id.middleware.js'

export const app = express()

if (env.TRUST_PROXY_HOPS > 0) {
  app.set('trust proxy', env.TRUST_PROXY_HOPS)
}

app.use(requestIdMiddleware)
app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }))
app.use(cookieParser())
app.use(globalRateLimiter)
app.use('/api/v1/payments', paymentsRouter)
app.get('/api/docs.json', (_request, response) => {
  response.status(200).json(openapiDocument)
})
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openapiDocument))
app.use(express.json())
app.use('/api/v1', v1Router)
app.use(notFoundMiddleware)
app.use(errorHandlerMiddleware)

export default app
