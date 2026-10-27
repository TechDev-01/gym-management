import { app } from './app.js'
import { initializeDatabase } from './config/database.js'
import { env } from './config/env.js'
import {
  closeQueues,
  createWorkers,
  closeWorkers,
  scheduleMembershipExpiry,
} from './jobs/index.js'
import { paymentGateway } from './modules/payments/index.js'
import { AppDataSource } from './database/data-source.js'
import { membershipExpiryService } from './modules/memberships/index.js'

async function start(): Promise<void> {
  await initializeDatabase()
  await scheduleMembershipExpiry(env.GYM_TIMEZONE)
  const workers = createWorkers(paymentGateway, undefined, undefined, membershipExpiryService)

  const server = app.listen(env.PORT, () => {
    console.log(`Server listening on port: ${env.PORT}`)
  })

  const shutdown = async (): Promise<void> => {
    server.close()
    await closeWorkers(workers)
    await closeQueues()
    await AppDataSource.destroy()
  }

  process.once('SIGINT', () => void shutdown())
  process.once('SIGTERM', () => void shutdown())
}

void start()
