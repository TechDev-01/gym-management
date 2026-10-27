import { z } from 'zod'

const idSchema = z.coerce.number().int().positive()
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must use YYYY-MM-DD format')
const measurement = z.number().nonnegative().finite()

export const progressIdSchema = z.object({ id: idSchema }).strict()

export const createProgressSchema = z.object({
  clientId: idSchema.optional(),
  measuredAt: dateSchema,
  weightKg: measurement.max(999.99).nullable().optional(),
  heightCm: measurement.max(999.99).nullable().optional(),
  bodyFatPct: z.number().min(0).max(100).finite().nullable().optional(),
  muscleKg: measurement.max(999.99).nullable().optional(),
  chestCm: measurement.max(999.99).nullable().optional(),
  waistCm: measurement.max(999.99).nullable().optional(),
  hipCm: measurement.max(999.99).nullable().optional(),
  armCm: measurement.max(999.99).nullable().optional(),
  thighCm: measurement.max(999.99).nullable().optional(),
  notes: z.string().trim().min(1).max(2000).nullable().optional(),
}).strict().refine((value) => [
  value.weightKg,
  value.heightCm,
  value.bodyFatPct,
  value.muscleKg,
  value.chestCm,
  value.waistCm,
  value.hipCm,
  value.armCm,
  value.thighCm,
].some((metric) => metric !== undefined && metric !== null), {
  message: 'At least one measurement is required',
})

export const progressQuerySchema = z.object({
  clientId: idSchema.optional(),
  from: dateSchema.optional(),
  to: dateSchema.optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
}).strict().refine((value) => !value.from || !value.to || value.from <= value.to, {
  message: 'from must be before or equal to to',
  path: ['from'],
})
