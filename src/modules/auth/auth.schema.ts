import { z } from 'zod'
import { UserRole } from './app-user.entity.js'

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1).max(1024),
}).strict()

export const registerSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8).max(1024),
  role: z.enum([UserRole.ADMIN, UserRole.RECEPTION]),
}).strict()

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
