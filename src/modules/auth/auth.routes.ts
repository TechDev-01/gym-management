import { Router } from 'express'
import { AuthController } from './auth.controller.js'
import type { AuthService } from './auth.service.js'

export function createAuthRouter(authService: AuthService): Router {
  const router = Router()
  const authController = new AuthController(authService)

  router.post('/login', authController.login)

  return router
}
