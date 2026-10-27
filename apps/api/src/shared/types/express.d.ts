export interface AuthenticatedRequestUser {
  id: string
  role: string
  clientId: number | null
  coachId: number | null
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedRequestUser
    }
  }
}
