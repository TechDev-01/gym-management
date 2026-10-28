import { AppDataSource } from '../../database/data-source.js'
import { CoachSchedule } from './coach-schedule.entity.js'
import { Coach } from './coach.entity.js'
import { TypeOrmCoachSchedulesRepository } from './coach-schedules.repository.js'
import { TypeOrmCoachesRepository } from './coaches.repository.js'
import { createCoachesRouter } from './coaches.routes.js'

const coachesRepository = new TypeOrmCoachesRepository(
  AppDataSource.getRepository(Coach),
)
const coachSchedulesRepository = new TypeOrmCoachSchedulesRepository(
  AppDataSource.getRepository(CoachSchedule),
)

export const coachesRouter = createCoachesRouter(
  coachesRepository,
  coachSchedulesRepository,
)

export default coachesRouter
