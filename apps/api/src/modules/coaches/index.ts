import { AppDataSource } from '../../database/data-source.js'
import { Coach } from './coach.entity.js'
import { TypeOrmCoachesRepository } from './coaches.repository.js'
import { createCoachesRouter } from './coaches.routes.js'

const coachesRepository = new TypeOrmCoachesRepository(
  AppDataSource.getRepository(Coach),
)

export const coachesRouter = createCoachesRouter(coachesRepository)

export default coachesRouter
