import { AppDataSource } from '../database/data-source.js'

export async function initializeDatabase(): Promise<void> {
  if (AppDataSource.isInitialized) {
    return
  }

  await AppDataSource.initialize()
}

export { AppDataSource }
