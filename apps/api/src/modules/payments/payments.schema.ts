import { z } from 'zod'
import { paginationSchema } from '../../shared/pagination.js'
import { PaymentMethod, PaymentStatus } from './payment.entity.js'

export const paymentIdSchema = z.object({
  id: z.coerce.number().int().positive(),
}).strict()

export const paymentQuerySchema = paginationSchema.extend({
  clientId: z.coerce.number().int().positive().optional(),
  subscriptionId: z.coerce.number().int().positive().optional(),
  method: z.nativeEnum(PaymentMethod).optional(),
  status: z.nativeEnum(PaymentStatus).optional(),
}).strict()
