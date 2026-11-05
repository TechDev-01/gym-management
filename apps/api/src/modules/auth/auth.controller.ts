import type { NextFunction, Request, Response } from 'express'
import { UnauthorizedError } from '../../shared/errors/unauthorized.error.js'
import { AuthenticationError, type AuthService } from './auth.service.js'

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  login = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      const authenticatedUser = await this.authService.authenticate(request.body)
      response.status(200).json(authenticatedUser)
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
      const authenticatedUser = await this.authService.register(request.body)
      response.status(201).json(authenticatedUser)
    } catch (error: unknown) {
      next(error)
    }
  }
}
