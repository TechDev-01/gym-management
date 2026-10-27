import { AppError } from './app-error.js'

export class PaymentGatewayError extends AppError {
  constructor(message = 'Payment provider unavailable') {
    super(message, 502)
  }
}
