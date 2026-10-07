import type { ErrorRequestHandler } from 'express'
import { ZodError } from 'zod'
import { AppError } from '../errors/app-error.js'

export const errorHandlerMiddleware: ErrorRequestHandler = (
  error: unknown,
  _request,
  response,
  _next,
): void => {
  if (response.headersSent) {
    return
  }

  if (error instanceof AppError) {
    response.status(error.statusCode).json({ error: error.message })
    return
  }

  if (error instanceof ZodError) {
    response.status(400).json({ error: 'Invalid request', issues: error.issues })
    return
  }

  response.status(500).json({ error: 'Internal server error' })
}
