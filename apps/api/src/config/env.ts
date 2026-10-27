import dotenv from 'dotenv'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { z } from 'zod'

const envPath = [resolve(process.cwd(), '.env'), resolve(process.cwd(), '../../.env')]
  .find((candidate) => existsSync(candidate))

dotenv.config({ path: envPath })

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  CORS_ORIGIN: z.string().url().default('http://localhost:5173'),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  REDIS_URL: z.string().url(),
  STRIPE_SECRET_KEY: z.string().min(1),
  STRIPE_WEBHOOK_SECRET: z.string().min(1),
  STRIPE_SUCCESS_URL: z.string().url().default('http://localhost:3000/payment-success'),
  STRIPE_CANCEL_URL: z.string().url().default('http://localhost:3000/payment-cancelled'),
  GYM_TIMEZONE: z.string().default('UTC'),
})

export const env = envSchema.parse(process.env)

export type Env = z.infer<typeof envSchema>
