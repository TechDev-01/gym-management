import { z } from 'zod'

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
})

export interface PaginationQuery {
  page: number
  limit: number
}

export interface Page<T> {
  items: T[]
  page: number
  limit: number
  total: number
}

export function toPage<T>(items: T[], total: number, query: PaginationQuery): Page<T> {
  return {
    items,
    page: query.page,
    limit: query.limit,
    total,
  }
}
