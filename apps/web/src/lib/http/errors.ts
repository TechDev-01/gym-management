export interface HttpErrorPayload {
  error?: string
  message?: string
  code?: string
  details?: unknown
  issues?: unknown
}

export class HttpError extends Error {
  readonly status: number
  readonly code: string | null
  readonly details: unknown

  constructor(
    message: string,
    options: {
      status: number
      code?: string | null
      details?: unknown
      cause?: unknown
    },
  ) {
    super(message, { cause: options.cause })
    this.name = 'HttpError'
    this.status = options.status
    this.code = options.code ?? null
    this.details = options.details
  }

  get isNetworkError(): boolean {
    return this.status === 0
  }
}

export function getDefaultErrorMessage(status: number): string {
  switch (status) {
    case 400:
      return 'La solicitud no es válida.'
    case 401:
      return 'La sesión no es válida o ha expirado.'
    case 403:
      return 'No tienes permisos para realizar esta acción.'
    case 404:
      return 'El recurso solicitado no existe.'
    case 500:
      return 'La API encontró un error interno.'
    default:
      return 'No fue posible completar la solicitud.'
  }
}
