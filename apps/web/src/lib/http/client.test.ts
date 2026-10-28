import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  accessTokenStorageKey,
  clearAccessToken,
  configureHttpClient,
  request,
  setAccessToken,
} from './client'
import { HttpError } from './errors'
import { jsonResponse } from '../../test-utils'

describe('HTTP client', () => {
  beforeEach(() => {
    sessionStorage.clear()
    vi.stubGlobal('fetch', vi.fn())
    configureHttpClient({ onUnauthorized: undefined })
  })

  afterEach(() => {
    clearAccessToken()
    vi.unstubAllGlobals()
  })

  it('adds the bearer token and serializes JSON request bodies', async () => {
    setAccessToken('token-123')
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({ id: 1 }))

    await expect(request<{ id: number }>('clients', {
      method: 'POST',
      body: { name: 'Ana' },
    })).resolves.toEqual({ id: 1 })

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/clients'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ name: 'Ana' }),
        headers: expect.any(Headers),
      }),
    )

    const [, init] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit]
    const headers = init.headers as Headers
    expect(headers.get('Authorization')).toBe('Bearer token-123')
    expect(headers.get('Content-Type')).toBe('application/json')
    expect(sessionStorage.getItem(accessTokenStorageKey)).toBe('token-123')
  })

  it('maps an API error response to HttpError with its details', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      jsonResponse({ error: 'No tienes permisos', code: 'FORBIDDEN', issues: ['role'] }, 403),
    )

    const promise = request('stats/dashboard')

    await expect(promise).rejects.toMatchObject({
      name: 'HttpError',
      status: 403,
      message: 'No tienes permisos',
      code: 'FORBIDDEN',
      details: ['role'],
    })
  })

  it('notifies the application when the API returns 401', async () => {
    const onUnauthorized = vi.fn()
    configureHttpClient({ onUnauthorized })
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({ error: 'Expired session' }, 401))

    await expect(request('clients')).rejects.toBeInstanceOf(HttpError)
    expect(onUnauthorized).toHaveBeenCalledOnce()
  })

  it('returns a network HttpError when fetch cannot connect', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error('offline'))

    await expect(request('clients')).rejects.toMatchObject({
      status: 0,
      code: 'NETWORK_ERROR',
      message: 'No fue posible conectar con la API.',
    })
  })
})
