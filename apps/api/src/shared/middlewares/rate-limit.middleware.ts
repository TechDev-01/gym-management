import { ipKeyGenerator, rateLimit } from 'express-rate-limit'
import type { Request, RequestHandler } from 'express'
import { env } from '../../config/env.js'
import { TooManyRequestsError } from '../errors/too-many-requests.error.js'

interface RateLimiterOptions {
  windowMs: number
  limit: number
  keyGenerator?: (request: Request) => string
  skip?: (request: Request) => boolean
}

function createRateLimiter(options: RateLimiterOptions): RequestHandler {
  return rateLimit({
    windowMs: options.windowMs,
    limit: options.limit,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    ...(options.keyGenerator ? { keyGenerator: options.keyGenerator } : {}),
    ...(options.skip ? { skip: options.skip } : {}),
    handler: (_request, _response, next): void => {
      next(new TooManyRequestsError(
        'Too many requests, please try again later',
        Math.ceil(options.windowMs / 1000),
      ))
    },
  })
}

function loginKey(request: Request): string {
  const body = request.body as { email?: unknown } | undefined
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : 'anonymous'
  return `${ipKeyGenerator(request.ip ?? 'unknown')}:${email}`
}

export const globalRateLimiter = createRateLimiter({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  limit: env.RATE_LIMIT_MAX,
  skip: (request) => request.path === '/api/v1/payments/webhook',
})

export const loginRateLimiter = createRateLimiter({
  windowMs: env.AUTH_RATE_LIMIT_WINDOW_MS,
  limit: env.AUTH_RATE_LIMIT_MAX,
  keyGenerator: loginKey,
})
