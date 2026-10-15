import type { NextFunction, Request, Response } from 'express'
import { ZodError } from 'zod'
import { AuthenticationError, type AuthService } from './auth.service.js'

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  login = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      const authenticatedUser = await this.authService.authenticate(request.body)
      response.status(200).json(authenticatedUser)
    } catch (error: unknown) {
      if (error instanceof AuthenticationError) {
        response.status(401).json({ error: error.message })
        return
      }

      if (error instanceof ZodError) {
        response.status(400).json({ error: 'Invalid login request' })
        return
      }

      next(error)
    }
  }
}
