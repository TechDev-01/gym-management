import { z } from 'zod'

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must use YYYY-MM-DD format')

export const dashboardQuerySchema = z.object({
  from: dateSchema.optional(),
  to: dateSchema.optional(),
  timezone: z.string().min(1).optional(),
}).strict().refine((value) => !value.from || !value.to || value.from <= value.to, {
  message: 'from must be before or equal to to',
  path: ['from'],
})

export const reportRequestSchema = z.object({
  reportType: z.literal('dashboard-summary'),
  from: dateSchema.optional(),
  to: dateSchema.optional(),
  timezone: z.string().min(1).optional(),
}).strict().refine((value) => !value.from || !value.to || value.from <= value.to, {
  message: 'from must be before or equal to to',
  path: ['from'],
})
