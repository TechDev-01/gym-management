import type { NextFunction, Request, Response } from 'express'
import type { ClientsService } from './clients.service.js'

export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  health = (_request: Request, response: Response): void => {
    response.status(200).json(this.clientsService.health())
  }

  create = async (
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const client = await this.clientsService.register(request.body)
      response.status(201).json(client)
    } catch (error: unknown) {
      next(error)
    }
  }
}
