import { initializeDatabase, AppDataSource } from './config/database.js'
import { env } from './config/env.js'
import {
  closeQueues,
  closeWorkers,
  createWorkers,
  scheduleMembershipExpiry,
} from './jobs/index.js'
import { membershipExpiryService } from './modules/memberships/index.js'
import { paymentGateway } from './modules/payments/index.js'
import { statsService } from './modules/stats/index.js'
import { ReportService } from './jobs/services.js'

async function start(): Promise<void> {
  await initializeDatabase()
  await scheduleMembershipExpiry(env.GYM_TIMEZONE)

  const workers = createWorkers(
    paymentGateway,
    undefined,
    new ReportService(statsService),
    membershipExpiryService,
  )

  let shuttingDown = false
  const shutdown = async (): Promise<void> => {
    if (shuttingDown) return
    shuttingDown = true
    await closeWorkers(workers)
    await closeQueues()
    await AppDataSource.destroy()
  }

  process.once('SIGINT', () => void shutdown())
  process.once('SIGTERM', () => void shutdown())
  console.log('Background workers started')
}

void start().catch((error: unknown) => {
  console.error('Unable to start background workers', error)
  process.exitCode = 1
})
