import { randomUUID } from 'node:crypto'
import type { RequestHandler } from 'express'

const requestIdPattern = /^[A-Za-z0-9._-]{1,128}$/

export const requestIdMiddleware: RequestHandler = (request, response, next): void => {
  const incomingRequestId = request.header('x-request-id')
  const requestId = incomingRequestId && requestIdPattern.test(incomingRequestId)
    ? incomingRequestId
    : randomUUID()

  response.locals.requestId = requestId
  response.setHeader('X-Request-Id', requestId)
  next()
}
