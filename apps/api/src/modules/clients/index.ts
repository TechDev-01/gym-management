import { AppDataSource } from '../../database/data-source.js'
import { Client } from './client.entity.js'
import { TypeOrmClientsRepository } from './clients.repository.js'
import { createClientsRouter } from './clients.routes.js'

const clientsRepository = new TypeOrmClientsRepository(
  AppDataSource.getRepository(Client),
)

export const clientsRouter = createClientsRouter(clientsRepository)

export default clientsRouter
