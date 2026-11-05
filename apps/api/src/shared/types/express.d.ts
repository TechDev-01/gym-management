export interface AuthenticatedRequestUser {
  id: string
  role: string
  clientId: number | null
  coachId: number | null
}

export interface ValidatedRequestData {
  body?: unknown
  params?: unknown
  query?: unknown
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedRequestUser
      validated?: ValidatedRequestData
    }
  }
}
