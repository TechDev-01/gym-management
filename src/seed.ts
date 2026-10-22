import bcrypt from 'bcrypt'
import { initializeDatabase, AppDataSource } from './config/database.js'
import { AppUser, UserRole } from './modules/auth/app-user.entity.js'

const adminEmail = 'admin@gym.local'
const adminPassword = 'Admin1234!'

async function seed(): Promise<void> {
  await initializeDatabase()

  const userRepository = AppDataSource.getRepository(AppUser)
  const existingAdmin = await userRepository.findOne({
    where: { email: adminEmail },
  })
  const passwordHash = await bcrypt.hash(adminPassword, 12)

  if (existingAdmin) {
    existingAdmin.passwordHash = passwordHash
    existingAdmin.role = UserRole.ADMIN
    existingAdmin.clientId = null
    existingAdmin.coachId = null
    existingAdmin.isActive = true
    existingAdmin.lastLoginAt = null
    await userRepository.save(existingAdmin)
    console.log(`Admin user updated: ${adminEmail}`)
  } else {
    const admin = userRepository.create({
      email: adminEmail,
      passwordHash,
      role: UserRole.ADMIN,
      clientId: null,
      coachId: null,
      isActive: true,
      lastLoginAt: null,
    })
    await userRepository.save(admin)
    console.log(`Admin user created: ${adminEmail}`)
  }
}

async function main(): Promise<void> {
  try {
    await seed()
  } catch (error: unknown) {
    console.error('Failed to seed admin user', error)
    process.exitCode = 1
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy()
    }
  }
}

void main()
