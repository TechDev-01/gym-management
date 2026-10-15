import { Router } from 'express'
import { authenticate } from '../../shared/middlewares/auth.middleware.js'
import { requireRole } from '../../shared/middlewares/role.middleware.js'
import { AuthController } from './auth.controller.js'
import type { AuthService } from './auth.service.js'

export function createAuthRouter(authService: AuthService): Router {
  const router = Router()
  const authController = new AuthController(authService)

  router.post('/login', authController.login)
  router.post('/register', authenticate(), requireRole('ADMIN'), authController.register)

  return router
}
