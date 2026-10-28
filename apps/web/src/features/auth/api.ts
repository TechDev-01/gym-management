import { request } from '../../lib/http'
import type { LoginResponse } from './types'

export function loginRequest(email: string, password: string): Promise<LoginResponse> {
  return request<LoginResponse>('auth/login', {
    method: 'POST',
    body: { email, password },
    handleUnauthorized: false,
  })
}
