import { z } from 'zod'

export const clientsHealthSchema = z.object({
  status: z.literal('ok'),
  module: z.literal('clients'),
})

export const createClientSchema = z.object({
  email: z.string().email(),
  dni: z.string().trim().min(1),
  name: z.string().trim().min(1),
  lastName: z.string().trim().min(1),
  phone: z.string().trim().min(1),
})
