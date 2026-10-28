import type { NextFunction, Request, Response } from 'express'
import { ConflictError } from '../../shared/errors/conflict.error.js'
import { paymentIdSchema } from './payments.schema.js'
import type { PaymentsService } from './payments.service.js'

export class PaymentsController {
  constructor(private readonly service: PaymentsService) {}

  list = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      response.json(await this.service.listPayments(request.query))
    } catch (error: unknown) {
      next(error)
    }
  }

  get = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = paymentIdSchema.parse(request.params)
      response.json(await this.service.getPayment(id))
    } catch (error: unknown) {
      next(error)
    }
  }

  webhook = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      const signature = request.header('stripe-signature')
      if (!signature || !Buffer.isBuffer(request.body)) {
        throw new ConflictError('Stripe signature or raw body is missing')
      }
      await this.service.handleWebhook(request.body, signature)
      response.status(200).json({ received: true })
    } catch (error: unknown) {
      next(error)
    }
  }
}
