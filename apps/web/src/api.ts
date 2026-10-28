import { request } from './lib/http'

export interface LoginResponse {
  accessToken: string
  user: {
    id: string
    email: string
    role: string
    clientId: number | null
    coachId: number | null
  }
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  return request<LoginResponse>('auth/login', {
    method: 'POST',
    body: { email, password },
    handleUnauthorized: false,
  })
}
