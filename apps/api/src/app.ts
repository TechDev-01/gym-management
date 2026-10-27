import express from 'express'
import cors from 'cors'
import swaggerUi from 'swagger-ui-express'
import { env } from './config/env.js'
import { paymentsRouter } from './modules/payments/index.js'
import { v1Router } from './routes/v1/index.js'
import { openapiDocument } from './docs/openapi.js'
import { errorHandlerMiddleware } from './shared/middlewares/error-handler.middleware.js'
import { notFoundMiddleware } from './shared/middlewares/not-found.middleware.js'

export const app = express()

app.use(cors({ origin: env.CORS_ORIGIN }))
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
