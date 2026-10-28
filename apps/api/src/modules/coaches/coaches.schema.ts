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

export const coachScheduleIdSchema = z.coerce.number().int().positive()

const scheduleTimeSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Time must use HH:mm format')

export const createCoachScheduleSchema = z
  .object({
    dayOfWeek: z.coerce.number().int().min(1).max(7),
    startTime: scheduleTimeSchema,
    endTime: scheduleTimeSchema,
  })
  .refine((input) => input.startTime < input.endTime, {
    message: 'startTime must be earlier than endTime',
    path: ['endTime'],
  })

export const updateCoachScheduleSchema = z
  .object({
    dayOfWeek: z.coerce.number().int().min(1).max(7).optional(),
    startTime: scheduleTimeSchema.optional(),
    endTime: scheduleTimeSchema.optional(),
  })
  .refine((input) => Object.keys(input).length > 0, {
    message: 'At least one field is required',
  })
