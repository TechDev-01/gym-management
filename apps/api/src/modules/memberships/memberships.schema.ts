import { z } from 'zod'
import { PaymentMethod } from '../payments/payment.entity.js'
import { SubscriptionStatus } from './subscription.entity.js'

export const membershipIdSchema = z.object({
  id: z.coerce.number().int().positive(),
}).strict()

export const createMembershipSchema = z.object({
  name: z.string().trim().min(1).max(50),
  description: z.string().trim().max(10000).nullable().optional(),
  durationDays: z.number().int().positive(),
  maxDaysPerWeek: z.number().int().positive().max(7).nullable().optional(),
  priceAmount: z.number().int().nonnegative(),
  currency: z.string().trim().length(3).toLowerCase().default('usd'),
  stripePriceId: z.string().trim().min(1).startsWith('price_').nullable().optional(),
}).strict()

export const updateMembershipSchema = z.object({
  name: z.string().trim().min(1).max(50).optional(),
  description: z.string().trim().max(10000).nullable().optional(),
  durationDays: z.number().int().positive().optional(),
  maxDaysPerWeek: z.number().int().positive().max(7).nullable().optional(),
  priceAmount: z.number().int().nonnegative().optional(),
}).strict().refine((value) => Object.keys(value).length > 0, {
  message: 'At least one field is required',
})

export const membershipStatusSchema = z.object({
  isActive: z.boolean(),
}).strict()

export const createSubscriptionSchema = z.object({
  clientId: z.number().int().positive(),
  membershipId: z.number().int().positive(),
  method: z.nativeEnum(PaymentMethod),
}).strict()

export const subscriptionIdSchema = z.object({
  id: z.coerce.number().int().positive(),
}).strict()

export const subscriptionQuerySchema = z.object({
  clientId: z.coerce.number().int().positive().optional(),
  status: z.nativeEnum(SubscriptionStatus).optional(),
}).strict()
