import { z } from 'zod'

export const clientsHealthSchema = z.object({
  status: z.literal('ok'),
  module: z.literal('clients'),
})

export const createClientSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(1024).optional(),
  dni: z.string().trim().min(1),
  name: z.string().trim().min(1),
  lastName: z.string().trim().min(1),
  phone: z.string().trim().min(1),
})

export const clientIdSchema = z.coerce.number().int().positive()

export const updateClientSchema = z
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
