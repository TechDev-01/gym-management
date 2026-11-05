import type { ErrorRequestHandler, Response } from 'express'
import { randomUUID } from 'node:crypto'
import { ZodError } from 'zod'
import { AppError } from '../errors/app-error.js'

interface ErrorBody {
  error: string
  code: string
  requestId: string
  timestamp: string
  path: string
  details?: unknown
  issues?: unknown
}

function isMalformedJsonError(error: unknown): boolean {
  return error instanceof SyntaxError
    && (error as SyntaxError & { type?: unknown }).type === 'entity.parse.failed'
}

function requestIdFrom(response: Response): string {
  const requestId: unknown = response.locals.requestId
  if (typeof requestId === 'string') {
    return requestId
  }

  const generatedRequestId = randomUUID()
  response.locals.requestId = generatedRequestId
  response.setHeader('X-Request-Id', generatedRequestId)
  return generatedRequestId
}

export const errorHandlerMiddleware: ErrorRequestHandler = (
  error: unknown,
  request,
  response,
  _next,
): void => {
  if (response.headersSent) {
    return
  }

  const base: Omit<ErrorBody, 'error' | 'code'> = {
    requestId: requestIdFrom(response),
    timestamp: new Date().toISOString(),
    path: request.originalUrl,
  }

  if (error instanceof AppError) {
    const retryAfterSeconds = (error.details as { retryAfterSeconds?: unknown } | undefined)
      ?.retryAfterSeconds
    if (error.statusCode === 429 && typeof retryAfterSeconds === 'number') {
      response.setHeader('Retry-After', String(retryAfterSeconds))
    }

    const body: ErrorBody = {
      error: error.message,
      code: error.code,
      ...base,
      ...(error.details === undefined ? {} : { details: error.details }),
    }
    response.status(error.statusCode).json(body)
    return
  }

  if (error instanceof ZodError) {
    response.status(400).json({
      error: 'Invalid request',
      code: 'VALIDATION_ERROR',
      ...base,
      details: error.issues,
      issues: error.issues,
    } satisfies ErrorBody)
    return
  }

  if (isMalformedJsonError(error)) {
    response.status(400).json({
      error: 'Malformed JSON body',
      code: 'INVALID_JSON',
      ...base,
    } satisfies ErrorBody)
    return
  }

  console.error('[api] Unhandled error', {
    requestId: base.requestId,
    path: base.path,
    error,
  })

  response.status(500).json({
    error: 'Internal server error',
    code: 'INTERNAL_ERROR',
    ...base,
  } satisfies ErrorBody)
}
