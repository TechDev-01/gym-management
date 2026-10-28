import type { NextFunction, Request, Response } from 'express'
import type { CoachesService } from './coaches.service.js'

export class CoachesController {
  constructor(private readonly coachesService: CoachesService) {}

  health = (_request: Request, response: Response): void => {
    response.status(200).json(this.coachesService.health())
  }

  create = async (
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const coach = await this.coachesService.register(request.body)
      response.status(201).json(coach)
    } catch (error: unknown) {
      next(error)
    }
  }

  getCoaches = async (
    _request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      response.status(200).json(await this.coachesService.getCoaches())
    } catch (error: unknown) {
      next(error)
    }
  }

  getCoach = async (
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      response.status(200).json(await this.coachesService.getCoach(request.params.id))
    } catch (error: unknown) {
      next(error)
    }
  }

  update = async (
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      response
        .status(200)
        .json(await this.coachesService.updateCoach(request.params.id, request.body))
    } catch (error: unknown) {
      next(error)
    }
  }
}
