import { AppDataSource } from '../../database/data-source.js'
import { Client } from '../clients/client.entity.js'
import { Coach } from '../coaches/coach.entity.js'
import { ClientRoutine } from './client-routine.entity.js'
import { Exercise } from './exercise.entity.js'
import { Routine } from './routine.entity.js'
import { RoutineExercise } from './routine-exercise.entity.js'
import { TypeOrmRoutinesRepository } from './routines.repository.js'
import { createRoutinesRouter } from './routines.routes.js'

const repository = new TypeOrmRoutinesRepository(
  AppDataSource.getRepository(Exercise),
  AppDataSource.getRepository(Routine),
  AppDataSource.getRepository(RoutineExercise),
  AppDataSource.getRepository(ClientRoutine),
  AppDataSource.getRepository(Client),
  AppDataSource.getRepository(Coach),
)

export const routinesRouter = createRoutinesRouter(repository)
export default routinesRouter
