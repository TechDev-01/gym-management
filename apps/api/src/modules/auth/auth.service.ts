import bcrypt from 'bcrypt'
import { createHash, randomBytes } from 'node:crypto'
import jwt from 'jsonwebtoken'
import type { SignOptions } from 'jsonwebtoken'
import { ConflictError } from '../../shared/errors/conflict.error.js'
import type { AuthRepository, AuthUser } from './auth.repository.js'
import { loginSchema, registerSchema } from './auth.schema.js'

export interface AuthenticatedUser {
  accessToken: string
  user: {
    id: string
    email: string
    role: string
    clientId: number | null
    coachId: number | null
  }
}

export interface SessionTokens extends AuthenticatedUser {
  refreshToken: string
  refreshExpiresAt: Date
}

export interface AuthContext {
  userAgent?: string | null
  ip?: string | null
}

interface IssuedSession extends SessionTokens {
  refreshTokenId: number
}

export class AuthenticationError extends Error {
  constructor() {
    super('Invalid email or password')
    this.name = 'AuthenticationError'
  }
}

export class AuthService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly jwtSecret: string,
    private readonly tokenExpiresIn: NonNullable<SignOptions['expiresIn']> = '1h',
    private readonly refreshTokenTtlDays = 7,
    private readonly now = () => new Date(),
  ) {
    if (jwtSecret.length === 0) {
      throw new Error('A JWT secret is required')
    }
  }

  async authenticate(input: unknown, context: AuthContext = {}): Promise<SessionTokens> {
    const credentials = loginSchema.parse(input)
    const user = await this.authRepository.findByEmail(credentials.email)

    if (
      !user ||
      !user.isActive ||
      !(await bcrypt.compare(credentials.password, user.passwordHash))
    ) {
      throw new AuthenticationError()
    }

    await this.authRepository.updateLastLogin(user.id, this.now())
    return this.toPublicSession(await this.issueSession(user, context))
  }

  async register(input: unknown, context: AuthContext = {}): Promise<SessionTokens> {
    const data = registerSchema.parse(input)
    const existingUser = await this.authRepository.findByEmail(data.email)

    if (existingUser) {
      throw new ConflictError('Email is already registered')
    }

    const user = await this.authRepository.create({
      email: data.email,
      passwordHash: await bcrypt.hash(data.password, 12),
      role: data.role,
      clientId: null,
      coachId: null,
      isActive: true,
      lastLoginAt: this.now(),
    })

    return this.toPublicSession(await this.issueSession(user, context))
  }

  async refresh(rawToken: string | undefined, context: AuthContext = {}): Promise<SessionTokens> {
    if (!rawToken) {
      throw new AuthenticationError()
    }

    const tokenHash = this.hashToken(rawToken)
    const storedToken = await this.authRepository.findRefreshTokenByHash(tokenHash)

    if (!storedToken) {
      throw new AuthenticationError()
    }

    if (storedToken.revokedAt) {
      await this.authRepository.revokeAllRefreshTokens(storedToken.userId)
      throw new AuthenticationError()
    }

    if (storedToken.expiresAt.getTime() <= this.now().getTime()) {
      await this.authRepository.revokeRefreshToken(storedToken.id)
      throw new AuthenticationError()
    }

    const user = await this.authRepository.findById(storedToken.userId)

    if (!user || !user.isActive) {
      await this.authRepository.revokeRefreshToken(storedToken.id)
      throw new AuthenticationError()
    }

    const issued = await this.issueSession(user, context)
    await this.authRepository.revokeRefreshToken(storedToken.id, issued.refreshTokenId)
    return this.toPublicSession(issued)
  }

  async logout(rawToken: string | undefined): Promise<void> {
    if (!rawToken) {
      return
    }

    const storedToken = await this.authRepository.findRefreshTokenByHash(this.hashToken(rawToken))

    if (storedToken && !storedToken.revokedAt) {
      await this.authRepository.revokeRefreshToken(storedToken.id)
    }
  }

  private async issueSession(user: AuthUser, context: AuthContext): Promise<IssuedSession> {
    const refreshToken = randomBytes(48).toString('base64url')
    const refreshExpiresAt = new Date(
      this.now().getTime() + this.refreshTokenTtlDays * 24 * 60 * 60 * 1000,
    )
    const { id: refreshTokenId } = await this.authRepository.createRefreshToken({
      userId: user.id,
      tokenHash: this.hashToken(refreshToken),
      expiresAt: refreshExpiresAt,
      userAgent: context.userAgent ?? null,
      ip: context.ip ?? null,
    })

    return {
      accessToken: jwt.sign(
        {
          sub: String(user.id),
          role: user.role,
          clientId: user.clientId,
          coachId: user.coachId,
        },
        this.jwtSecret,
        { expiresIn: this.tokenExpiresIn },
      ),
      user: {
        id: String(user.id),
        email: user.email,
        role: user.role,
        clientId: user.clientId,
        coachId: user.coachId,
      },
      refreshToken,
      refreshExpiresAt,
      refreshTokenId,
    }
  }

  private toPublicSession(session: IssuedSession): SessionTokens {
    const { refreshTokenId: _refreshTokenId, ...publicSession } = session
    return publicSession
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex')
  }
}
