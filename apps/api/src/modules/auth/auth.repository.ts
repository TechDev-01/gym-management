import type { Repository } from 'typeorm'
import { type AppUser, type UserRole } from './app-user.entity.js'

export interface AuthUser {
  id: number
  email: string
  passwordHash: string
  role: UserRole
  clientId: number | null
  coachId: number | null
  isActive: boolean
  lastLoginAt: Date | null
}

export interface AuthRepository {
  findByEmail(email: string): Promise<AuthUser | null>
  create(user: Omit<AuthUser, 'id'>): Promise<AuthUser>
  updateLastLogin(id: number, lastLoginAt: Date): Promise<void>
}

export class TypeOrmAuthRepository implements AuthRepository {
  constructor(private readonly repository: Repository<AppUser>) {}

  async findByEmail(email: string): Promise<AuthUser | null> {
    return this.repository.findOne({ where: { email } })
  }

  async create(user: Omit<AuthUser, 'id'>): Promise<AuthUser> {
    const entity = this.repository.create(user)
    return this.repository.save(entity)
  }

  async updateLastLogin(id: number, lastLoginAt: Date): Promise<void> {
    await this.repository.update(id, { lastLoginAt })
  }
}
