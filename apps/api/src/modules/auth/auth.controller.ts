import type { NextFunction, Request, Response } from 'express'
import { UnauthorizedError } from '../../shared/errors/unauthorized.error.js'
import { AuthenticationError, type AuthContext, type AuthService } from './auth.service.js'
import {
  clearRefreshTokenCookie,
  refreshTokenCookieName,
  setRefreshTokenCookie,
} from './auth.cookies.js'

function authContext(request: Request): AuthContext {
  return {
    userAgent: request.get('user-agent') ?? null,
    ip: request.ip ?? null,
  }
}

function refreshTokenFrom(request: Request): string | undefined {
  const cookies = request.cookies as Record<string, unknown> | undefined
  const token = cookies?.[refreshTokenCookieName]
  return typeof token === 'string' ? token : undefined
}

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  login = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      const session = await this.authService.authenticate(request.body, authContext(request))
      setRefreshTokenCookie(response, session.refreshToken, session.refreshExpiresAt)
      response.status(200).json({ accessToken: session.accessToken, user: session.user })
    } catch (error: unknown) {
      if (error instanceof AuthenticationError) {
        next(new UnauthorizedError(error.message))
        return
      }

      next(error)
    }
  }

  register = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      const session = await this.authService.register(request.body, authContext(request))
      setRefreshTokenCookie(response, session.refreshToken, session.refreshExpiresAt)
      response.status(201).json({ accessToken: session.accessToken, user: session.user })
    } catch (error: unknown) {
      next(error)
    }
  }

  refresh = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      const session = await this.authService.refresh(
        refreshTokenFrom(request),
        authContext(request),
      )
      setRefreshTokenCookie(response, session.refreshToken, session.refreshExpiresAt)
      response.status(200).json({ accessToken: session.accessToken, user: session.user })
    } catch (error: unknown) {
      if (error instanceof AuthenticationError) {
        clearRefreshTokenCookie(response)
        next(new UnauthorizedError('Invalid or expired refresh token'))
        return
      }

      next(error)
    }
  }

  logout = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      await this.authService.logout(refreshTokenFrom(request))
      clearRefreshTokenCookie(response)
      response.status(204).send()
    } catch (error: unknown) {
      next(error)
    }
  }
}
