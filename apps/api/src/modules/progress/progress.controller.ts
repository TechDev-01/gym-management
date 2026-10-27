import type { NextFunction, Request, Response } from 'express'
import type { ProgressService } from './progress.service.js'

export class ProgressController {
  constructor(private readonly service: ProgressService) {}

  create = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try { response.status(201).json(await this.service.create(request.body, request.user!)) } catch (error: unknown) { next(error) }
  }

  list = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try { response.json(await this.service.list(request.query, request.user!)) } catch (error: unknown) { next(error) }
  }

  get = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try { response.json(await this.service.get(request.params.id, request.user!)) } catch (error: unknown) { next(error) }
  }
}
