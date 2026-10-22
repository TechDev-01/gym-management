import { app } from './app.js'
import { initializeDatabase } from './config/database.js'
import { env } from './config/env.js'

async function start(): Promise<void> {
  await initializeDatabase()

  app.listen(env.PORT, () => {
    console.log(`Server listening on port: ${env.PORT}`)
  })
}

void start()
