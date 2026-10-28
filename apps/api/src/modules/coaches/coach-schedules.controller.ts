import type { NextFunction, Request, Response } from 'express'
import type { CoachSchedulesService } from './coach-schedules.service.js'

export class CoachSchedulesController {
  constructor(private readonly schedulesService: CoachSchedulesService) {}

  list = async (
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      response
        .status(200)
        .json(await this.schedulesService.listSchedules(request.params.coachId))
    } catch (error: unknown) {
      next(error)
    }
  }

  create = async (
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      response
        .status(201)
        .json(
          await this.schedulesService.createSchedule(
            request.params.coachId,
            request.body,
          ),
        )
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
        .json(
          await this.schedulesService.updateSchedule(
            request.params.coachId,
            request.params.scheduleId,
            request.body,
          ),
        )
    } catch (error: unknown) {
      next(error)
    }
  }

  remove = async (
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      await this.schedulesService.deleteSchedule(
        request.params.coachId,
        request.params.scheduleId,
      )
      response.status(204).send()
    } catch (error: unknown) {
      next(error)
    }
  }
}
