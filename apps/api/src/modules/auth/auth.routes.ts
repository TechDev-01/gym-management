import { Router } from 'express'
import { authenticate } from '../../shared/middlewares/auth.middleware.js'
import { requireRole } from '../../shared/middlewares/role.middleware.js'
import { validate } from '../../shared/middlewares/validate.middleware.js'
import { AuthController } from './auth.controller.js'
import { loginSchema, registerSchema } from './auth.schema.js'
import type { AuthService } from './auth.service.js'

export function createAuthRouter(authService: AuthService): Router {
  const router = Router()
  const authController = new AuthController(authService)

  router.post('/login', validate({ body: loginSchema }), authController.login)
  router.post(
    '/register',
    authenticate(),
    requireRole('ADMIN'),
    validate({ body: registerSchema }),
    authController.register,
  )

  return router
}
