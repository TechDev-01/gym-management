import { request } from './client'

export interface Page<T> {
  items: T[]
  page: number
  limit: number
  total: number
}

function buildPath(path: string, params: object): string {
  const searchParams = new URLSearchParams()

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) {
      searchParams.set(key, String(value))
    }
  }

  const query = searchParams.toString()
  return query ? `${path}?${query}` : path
}

export async function requestAllPages<T>(path: string, params: object = {}): Promise<T[]> {
  const limit = 100
  const items: T[] = []
  let page = 1

  while (true) {
    const result = await request<Page<T>>(buildPath(path, { ...params, page, limit }))
    items.push(...result.items)

    if (result.items.length === 0 || items.length >= result.total) {
      break
    }

    page += 1
  }

  return items
}
