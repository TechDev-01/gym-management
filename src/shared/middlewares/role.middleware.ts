import type { RequestHandler } from 'express'
import { ForbiddenError } from '../errors/forbidden.error.js'
import { UnauthorizedError } from '../errors/unauthorized.error.js'

export function requireRole(...roles: string[]): RequestHandler {
  return (request, _response, next): void => {
    if (!request.user) {
      next(new UnauthorizedError())
      return
    }

    if (!roles.includes(request.user.role)) {
      next(new ForbiddenError())
      return
    }

    next()
  }
}
