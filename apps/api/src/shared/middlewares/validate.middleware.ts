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
        request.body = schemas.body.parse(request.body)
      }

      if (schemas.params) {
        schemas.params.parse(request.params)
      }

      if (schemas.query) {
        schemas.query.parse(request.query)
      }

      next()
    } catch (error: unknown) {
      next(error)
    }
  }
}
