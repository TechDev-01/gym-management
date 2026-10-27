import { AppDataSource } from '../../database/data-source.js'
import { ReportService } from '../../jobs/services.js'
import { Attendance } from '../attendance/attendance.entity.js'
import { Client } from '../clients/client.entity.js'
import { Coach } from '../coaches/coach.entity.js'
import { Subscription } from '../memberships/subscription.entity.js'
import { Payment } from '../payments/payment.entity.js'
import { ClientRoutine } from '../routines/client-routine.entity.js'
import { ProgressRecord } from '../progress/progress-record.entity.js'
import { Routine } from '../routines/routine.entity.js'
import { env } from '../../config/env.js'
import { createStatsRouter } from './stats.routes.js'
import { TypeOrmStatsRepository } from './stats.repository.js'
import { StatsService } from './stats.service.js'

export const statsService = new StatsService(
  new TypeOrmStatsRepository(
    AppDataSource.getRepository(Client),
    AppDataSource.getRepository(Subscription),
    AppDataSource.getRepository(Payment),
    AppDataSource.getRepository(Attendance),
    AppDataSource.getRepository(Coach),
    AppDataSource.getRepository(Routine),
    AppDataSource.getRepository(ClientRoutine),
    AppDataSource.getRepository(ProgressRecord),
  ),
  env.GYM_TIMEZONE,
)

export const statsRouter = createStatsRouter(statsService, new ReportService(statsService))
export default statsRouter
