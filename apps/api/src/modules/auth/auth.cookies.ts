import type { Response } from 'express'
import { env } from '../../config/env.js'

export const refreshTokenCookieName = 'gym_refresh_token'
export const refreshTokenCookiePath = '/api/v1/auth'

function cookieOptions() {
  return {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    path: refreshTokenCookiePath,
  }
}

export function setRefreshTokenCookie(
  response: Response,
  token: string,
  expiresAt: Date,
): void {
  response.cookie(refreshTokenCookieName, token, {
    ...cookieOptions(),
    expires: expiresAt,
  })
}

export function clearRefreshTokenCookie(response: Response): void {
  response.clearCookie(refreshTokenCookieName, cookieOptions())
}
