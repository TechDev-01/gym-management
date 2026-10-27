import 'reflect-metadata'
import { DataSource, type DataSourceOptions } from 'typeorm'
import { env } from '../config/env.js'
import { Attendance } from '../modules/attendance/attendance.entity.js'
import { AppUser } from '../modules/auth/app-user.entity.js'
import { Client } from '../modules/clients/client.entity.js'
import { Coach } from '../modules/coaches/coach.entity.js'
import { CoachSchedule } from '../modules/coaches/coach-schedule.entity.js'
import { Membership } from '../modules/memberships/membership.entity.js'
import { Subscription } from '../modules/memberships/subscription.entity.js'
import { Payment } from '../modules/payments/payment.entity.js'
import { StripeEvent } from '../modules/payments/stripe-event.entity.js'
import { ProgressRecord } from '../modules/progress/progress-record.entity.js'
import { ClientRoutine } from '../modules/routines/client-routine.entity.js'
import { Exercise } from '../modules/routines/exercise.entity.js'
import { Routine } from '../modules/routines/routine.entity.js'
import { RoutineExercise } from '../modules/routines/routine-exercise.entity.js'

export const moduleEntities = [
  AppUser,
  Client,
  Coach,
  CoachSchedule,
  Membership,
  Subscription,
  Payment,
  StripeEvent,
  Attendance,
  Exercise,
  Routine,
  RoutineExercise,
  ClientRoutine,
  ProgressRecord,
] satisfies DataSourceOptions['entities']

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: env.DATABASE_URL,
  entities: moduleEntities,
  migrations: ['dist/database/migrations/*.js'],
  synchronize: false,
  logging: env.NODE_ENV === 'development',
})
