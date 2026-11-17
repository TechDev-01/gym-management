import { appConfig } from '../../app/config'
import { getDefaultErrorMessage, HttpError, type HttpErrorPayload } from './errors'

export const accessTokenStorageKey = 'gym-management.access-token'

export interface HttpRequestOptions extends Omit<RequestInit, 'body' | 'headers'> {
  body?: unknown
  headers?: Record<string, string>
  handleUnauthorized?: boolean
  handleRefresh?: boolean
}

export type UnauthorizedHandler = (error: HttpError) => void
export type RefreshHandler = () => Promise<string | null>

interface HttpClientConfig {
  onUnauthorized?: UnauthorizedHandler
  onRefresh?: RefreshHandler
}

let unauthorizedHandler: UnauthorizedHandler = (error) => {
  sessionStorage.removeItem(accessTokenStorageKey)

  if (window.location.pathname !== '/login') {
    window.location.assign('/login')
  }

  console.warn(error.message)
}

let refreshHandler: RefreshHandler | null = null
let refreshPromise: Promise<string | null> | null = null

export function configureHttpClient(config: HttpClientConfig): void {
  unauthorizedHandler = config.onUnauthorized ?? unauthorizedHandler
  refreshHandler = config.onRefresh ?? null
}

export function getAccessToken(): string | null {
  return sessionStorage.getItem(accessTokenStorageKey)
}

export function setAccessToken(token: string): void {
  sessionStorage.setItem(accessTokenStorageKey, token)
}

export function clearAccessToken(): void {
  sessionStorage.removeItem(accessTokenStorageKey)
}

function getRequestUrl(path: string): string {
  const baseUrl = appConfig.apiUrl.replace(/\/+$/, '')
  return `${baseUrl}/${path.replace(/^\/+/, '')}`
}

async function parseResponseBody(response: Response): Promise<unknown> {
  const body = await response.text()

  if (!body) {
    return undefined
  }

  try {
    return JSON.parse(body) as unknown
  } catch {
    return body
  }
}

function getErrorPayload(body: unknown): HttpErrorPayload {
  if (typeof body !== 'object' || body === null) {
    return {}
  }

  return body as HttpErrorPayload
}

function createHttpError(status: number, body: unknown): HttpError {
  const payload = getErrorPayload(body)
  const message =
    payload.error ??
    payload.message ??
    (typeof body === 'string' ? body : getDefaultErrorMessage(status))

  return new HttpError(message, {
    status,
    code: payload.code,
    details: payload.details ?? payload.issues,
  })
}

async function attemptTokenRefresh(): Promise<string | null> {
  if (!refreshHandler) {
    return null
  }

  if (!refreshPromise) {
    refreshPromise = refreshHandler()
      .catch(() => null)
      .finally(() => {
        refreshPromise = null
      })
  }

  return refreshPromise
}

export async function request<T>(
  path: string,
  options: HttpRequestOptions = {},
): Promise<T> {
  const {
    body: requestBody,
    headers: requestHeaders,
    handleUnauthorized,
    handleRefresh,
    ...requestInit
  } = options

  const send = async (token: string | null): Promise<Response> => {
    const headers = new Headers(requestHeaders)

    if (requestBody !== undefined) {
      headers.set('Content-Type', 'application/json')
    }

    if (token) {
      headers.set('Authorization', `Bearer ${token}`)
    }

    try {
      return await fetch(getRequestUrl(path), {
        credentials: 'include',
        ...requestInit,
        body: requestBody === undefined ? undefined : JSON.stringify(requestBody),
        headers,
      })
    } catch (cause: unknown) {
      throw new HttpError('No fue posible conectar con la API.', {
        status: 0,
        code: 'NETWORK_ERROR',
        cause,
      })
    }
  }

  let token = getAccessToken()
  let response = await send(token)
  let body = await parseResponseBody(response)

  if (response.status === 401 && handleRefresh !== false) {
    const refreshedToken = await attemptTokenRefresh()

    if (refreshedToken) {
      token = refreshedToken
      response = await send(token)
      body = await parseResponseBody(response)
    }
  }

  if (!response.ok) {
    const error = createHttpError(response.status, body)

    if (response.status === 401 && handleUnauthorized !== false) {
      unauthorizedHandler(error)
    }

    throw error
  }

  return body as T
}
