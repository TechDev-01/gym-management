import { AppError } from './app-error.js'

export class TooManyRequestsError extends AppError {
  constructor(message = 'Too many requests', retryAfterSeconds?: number) {
    super(
      message,
      429,
      'RATE_LIMITED',
      retryAfterSeconds === undefined ? undefined : { retryAfterSeconds },
    )
  }
}
