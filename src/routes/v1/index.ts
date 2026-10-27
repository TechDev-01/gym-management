import { Router } from 'express'
import { env } from '../../config/env.js'
import { AppDataSource } from '../../database/data-source.js'
import { AppUser } from '../../modules/auth/app-user.entity.js'
import { TypeOrmAuthRepository } from '../../modules/auth/auth.repository.js'
import { AuthService } from '../../modules/auth/auth.service.js'
import { createAuthRouter } from '../../modules/auth/auth.routes.js'
import { clientsRouter } from '../../modules/clients/index.js'
import { membershipsRouter, subscriptionsRouter } from '../../modules/memberships/index.js'
import { coachesRouter } from '../../modules/coaches/index.js'
import { attendanceRouter } from '../../modules/attendance/index.js'
import { routinesRouter } from '../../modules/routines/index.js'
import { progressRouter } from '../../modules/progress/index.js'

export const v1Router = Router()

const authRepository = new TypeOrmAuthRepository(
  AppDataSource.getRepository(AppUser),
)
const authService = new AuthService(authRepository, env.JWT_SECRET)

v1Router.get('/health', (_request, response) => {
  response.status(200).json({ status: 'ok' })
})

v1Router.use('/auth', createAuthRouter(authService))
v1Router.use('/clients', clientsRouter)
v1Router.use('/memberships', membershipsRouter)
v1Router.use('/subscriptions', subscriptionsRouter)
v1Router.use('/coaches', coachesRouter)
v1Router.use('/attendance', attendanceRouter)
v1Router.use('/routines', routinesRouter)
v1Router.use('/progress', progressRouter)
