import { z } from 'zod'

export const coachesHealthSchema = z.object({
  status: z.literal('ok'),
  module: z.literal('coaches'),
})

export const coachIdSchema = z.coerce.number().int().positive()

export const createCoachSchema = z.object({
  email: z.string().email(),
  dni: z.string().trim().min(1),
  name: z.string().trim().min(1),
  lastName: z.string().trim().min(1),
  phone: z.string().trim().min(1),
})

export const updateCoachSchema = z
  .object({
    email: z.string().email().optional(),
    dni: z.string().trim().min(1).optional(),
    name: z.string().trim().min(1).optional(),
    lastName: z.string().trim().min(1).optional(),
    phone: z.string().trim().min(1).optional(),
  })
  .refine((input) => Object.keys(input).length > 0, {
    message: 'At least one field is required',
  })
