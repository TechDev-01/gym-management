import { request } from '../../lib/http'
import type { LoginResponse } from './types'

export function loginRequest(email: string, password: string): Promise<LoginResponse> {
  return request<LoginResponse>('auth/login', {
    method: 'POST',
    body: { email, password },
    handleUnauthorized: false,
    handleRefresh: false,
  })
}

export function refreshRequest(): Promise<LoginResponse> {
  return request<LoginResponse>('auth/refresh', {
    method: 'POST',
    handleUnauthorized: false,
    handleRefresh: false,
  })
}

export function logoutRequest(): Promise<void> {
  return request<void>('auth/logout', {
    method: 'POST',
    handleUnauthorized: false,
    handleRefresh: false,
  })
}
