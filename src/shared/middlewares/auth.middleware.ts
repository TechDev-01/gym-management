import type { RequestHandler } from 'express'
import jwt from 'jsonwebtoken'
import { UnauthorizedError } from '../errors/unauthorized.error.js'
import type { AuthenticatedRequestUser } from '../types/express.js'

interface JwtPayload {
  sub: string
  role: string
  email?: string
  clientId?: string
  coachId?: string
}

function isJwtPayload(payload: unknown): payload is JwtPayload {
  if (!payload || typeof payload !== 'object') {
    return false
  }

  const candidate = payload as Record<string, unknown>

  return typeof candidate.sub === 'string' && typeof candidate.role === 'string'
}

export function authenticate(jwtSecret = process.env.JWT_SECRET): RequestHandler {
  return (request, _response, next): void => {
    try {
      if (!jwtSecret) {
        throw new UnauthorizedError('JWT secret is not configured')
      }

      const authorization = request.header('authorization')
      const [scheme, token] = authorization?.split(' ') ?? []

      if (scheme !== 'Bearer' || !token) {
        throw new UnauthorizedError('Missing bearer token')
      }

      const payload = jwt.verify(token, jwtSecret)

      if (!isJwtPayload(payload)) {
        throw new UnauthorizedError('Invalid token payload')
      }

      const authenticatedUser: AuthenticatedRequestUser = {
        id: payload.sub,
        role: payload.role,
        email: payload.email,
        clientId: payload.clientId,
        coachId: payload.coachId,
      }

      request.user = authenticatedUser
      next()
    } catch (error: unknown) {
      if (error instanceof UnauthorizedError) {
        next(error)
        return
      }

      next(new UnauthorizedError('Invalid or expired token'))
    }
  }
}
