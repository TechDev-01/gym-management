import type { ConnectionOptions } from 'bullmq'
import IORedis, { type Redis } from 'ioredis'
import { env } from './env.js'

export const redisConnectionOptions = {
  url: env.REDIS_URL,
  maxRetriesPerRequest: null,
} satisfies ConnectionOptions

export function createRedisConnection(): Redis {
  return new IORedis(env.REDIS_URL, {
    maxRetriesPerRequest: null,
  })
}
