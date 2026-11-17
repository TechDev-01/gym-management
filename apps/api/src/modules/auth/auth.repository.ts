import { IsNull, type Repository } from 'typeorm'
import { type AppUser, type UserRole } from './app-user.entity.js'
import { RefreshToken } from './refresh-token.entity.js'

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

export interface RefreshTokenRecord {
  id: number
  userId: number
  expiresAt: Date
  revokedAt: Date | null
}

export interface CreateRefreshTokenInput {
  userId: number
  tokenHash: string
  expiresAt: Date
  userAgent: string | null
  ip: string | null
}

export interface AuthRepository {
  findByEmail(email: string): Promise<AuthUser | null>
  findById(id: number): Promise<AuthUser | null>
  create(user: Omit<AuthUser, 'id'>): Promise<AuthUser>
  updateLastLogin(id: number, lastLoginAt: Date): Promise<void>
  createRefreshToken(input: CreateRefreshTokenInput): Promise<{ id: number }>
  findRefreshTokenByHash(tokenHash: string): Promise<RefreshTokenRecord | null>
  revokeRefreshToken(id: number, replacedById?: number | null): Promise<void>
  revokeAllRefreshTokens(userId: number): Promise<void>
}

export class TypeOrmAuthRepository implements AuthRepository {
  constructor(
    private readonly repository: Repository<AppUser>,
    private readonly refreshTokenRepository: Repository<RefreshToken>,
  ) {}

  async findByEmail(email: string): Promise<AuthUser | null> {
    return this.repository.findOne({ where: { email } })
  }

  async findById(id: number): Promise<AuthUser | null> {
    return this.repository.findOne({ where: { id } })
  }

  async create(user: Omit<AuthUser, 'id'>): Promise<AuthUser> {
    const entity = this.repository.create(user)
    return this.repository.save(entity)
  }

  async updateLastLogin(id: number, lastLoginAt: Date): Promise<void> {
    await this.repository.update(id, { lastLoginAt })
  }

  async createRefreshToken(input: CreateRefreshTokenInput): Promise<{ id: number }> {
    const token = this.refreshTokenRepository.create({
      userId: input.userId,
      tokenHash: input.tokenHash,
      expiresAt: input.expiresAt,
      revokedAt: null,
      replacedById: null,
      userAgent: input.userAgent,
      ip: input.ip,
    })
    const saved = await this.refreshTokenRepository.save(token)
    return { id: saved.id }
  }

  async findRefreshTokenByHash(tokenHash: string): Promise<RefreshTokenRecord | null> {
    return this.refreshTokenRepository.findOne({
      where: { tokenHash },
      select: {
        id: true,
        userId: true,
        expiresAt: true,
        revokedAt: true,
      },
    })
  }

  async revokeRefreshToken(id: number, replacedById: number | null = null): Promise<void> {
    await this.refreshTokenRepository.update(id, {
      revokedAt: new Date(),
      replacedById,
    })
  }

  async revokeAllRefreshTokens(userId: number): Promise<void> {
    await this.refreshTokenRepository.update(
      { userId, revokedAt: IsNull() },
      { revokedAt: new Date() },
    )
  }
}
