import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto'
import jwt from 'jsonwebtoken'
import type { SignOptions } from 'jsonwebtoken'
import type { AuthRepository } from './auth.repository.js'
import { loginSchema } from './auth.schema.js'

export interface AuthenticatedUser {
  accessToken: string
  user: {
    id: string
    email: string
    role: string
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

    if (!user || !(await verifyPassword(credentials.password, user.passwordHash))) {
      throw new AuthenticationError()
    }

    return {
      accessToken: jwt.sign(
        { sub: user.id, email: user.email, role: user.role },
        this.jwtSecret,
        { expiresIn: this.tokenExpiresIn },
      ),
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    }
  }
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex')
  const derivedKey = await deriveKey(password, salt, 64)

  return `${salt}:${derivedKey.toString('hex')}`
}

async function verifyPassword(password: string, passwordHash: string): Promise<boolean> {
  const [salt, storedKey] = passwordHash.split(':')

  if (!salt || !storedKey || storedKey.length % 2 !== 0 || !/^[a-f0-9]+$/i.test(storedKey)) {
    return false
  }

  const storedKeyBuffer = Buffer.from(storedKey, 'hex')
  const derivedKey = await deriveKey(password, salt, storedKeyBuffer.length)

  return timingSafeEqual(storedKeyBuffer, derivedKey)
}

function deriveKey(password: string, salt: string, keyLength: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, keyLength, (error, derivedKey) => {
      if (error) {
        reject(error)
        return
      }

      resolve(derivedKey)
    })
  })
}
