import { z } from 'zod'
import { PaymentMethod, PaymentStatus } from './payment.entity.js'

export const paymentIdSchema = z.object({
  id: z.coerce.number().int().positive(),
}).strict()

export const paymentQuerySchema = z.object({
  clientId: z.coerce.number().int().positive().optional(),
  subscriptionId: z.coerce.number().int().positive().optional(),
  method: z.nativeEnum(PaymentMethod).optional(),
  status: z.nativeEnum(PaymentStatus).optional(),
}).strict()
