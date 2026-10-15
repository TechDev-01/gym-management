import bcrypt from 'bcrypt'
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
  ) {
    if (jwtSecret.length === 0) {
      throw new Error('A JWT secret is required')
    }
  }

  async authenticate(input: unknown): Promise<AuthenticatedUser> {
    const credentials = loginSchema.parse(input)
    const user = await this.authRepository.findByEmail(credentials.email)

    if (
      !user ||
      !user.isActive ||
      !(await bcrypt.compare(credentials.password, user.passwordHash))
    ) {
      throw new AuthenticationError()
    }

    await this.authRepository.updateLastLogin(user.id, new Date())
    return this.createAuthenticatedUser(user)
  }

  async register(input: unknown): Promise<AuthenticatedUser> {
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
      lastLoginAt: new Date(),
    })

    return this.createAuthenticatedUser(user)
  }

  private createAuthenticatedUser(user: AuthUser): AuthenticatedUser {
    const clientId = user.clientId
    const coachId = user.coachId

    return {
      accessToken: jwt.sign(
        {
          sub: String(user.id),
          role: user.role,
          clientId,
          coachId,
        },
        this.jwtSecret,
        { expiresIn: this.tokenExpiresIn },
      ),
      user: {
        id: String(user.id),
        email: user.email,
        role: user.role,
        clientId,
        coachId,
      },
    }
  }
}
