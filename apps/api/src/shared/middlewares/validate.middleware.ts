import type { NextFunction, Request, RequestHandler, Response } from 'express'
import type { ZodType } from 'zod'

interface ValidationSchemas {
  body?: ZodType
  params?: ZodType
  query?: ZodType
}

export function validate(schemas: ValidationSchemas): RequestHandler {
  return (request: Request, _response: Response, next: NextFunction): void => {
    try {
      if (schemas.body) {
        const body = schemas.body.parse(request.body)
        request.body = body
        request.validated = { ...request.validated, body }
      }

      if (schemas.params) {
        request.validated = {
          ...request.validated,
          params: schemas.params.parse(request.params),
        }
      }

      if (schemas.query) {
        request.validated = {
          ...request.validated,
          query: schemas.query.parse(request.query),
        }
      }

      next()
    } catch (error: unknown) {
      next(error)
    }
  }
}
