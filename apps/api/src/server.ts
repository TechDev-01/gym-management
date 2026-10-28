import { app } from './app.js'
import { initializeDatabase } from './config/database.js'
import { env } from './config/env.js'
import { AppDataSource } from './database/data-source.js'

async function start(): Promise<void> {
  await initializeDatabase()

  const server = app.listen(env.PORT, '0.0.0.0', () => {
    console.log(`Server listening on port: ${env.PORT}`)
  })

  const shutdown = async (): Promise<void> => {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()))
    })
    await AppDataSource.destroy()
  }

  process.once('SIGINT', () => void shutdown())
  process.once('SIGTERM', () => void shutdown())
}

void start().catch((error: unknown) => {
  console.error('Unable to start API server', error)
  process.exitCode = 1
})
