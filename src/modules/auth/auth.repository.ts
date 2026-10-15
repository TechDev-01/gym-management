export interface AuthUser {
  id: string
  email: string
  passwordHash: string
  role: string
}

export interface AuthRepository {
  findByEmail(email: string): Promise<AuthUser | null>
}
