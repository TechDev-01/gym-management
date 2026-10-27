import { z } from 'zod'

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must use YYYY-MM-DD format')

export const attendanceIdSchema = z.object({
  id: z.coerce.number().int().positive(),
}).strict()

export const checkInSchema = z.object({
  clientId: z.number().int().positive().optional(),
}).strict()

export const attendanceQuerySchema = z.object({
  clientId: z.coerce.number().int().positive().optional(),
  from: dateSchema.optional(),
  to: dateSchema.optional(),
  open: z.enum(['true', 'false']).transform((value) => value === 'true').optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
}).strict().refine((value) => !value.from || !value.to || value.from <= value.to, {
  message: 'from must be before or equal to to',
  path: ['from'],
})
