export interface AuthenticatedRequestUser {
  id: string
  role: string
  email?: string
  clientId?: string
  coachId?: string
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedRequestUser
    }
  }
}
