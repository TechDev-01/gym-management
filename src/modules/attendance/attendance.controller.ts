import type { NextFunction, Request, Response } from 'express'
import type { AttendanceService } from './attendance.service.js'
import { attendanceIdSchema, attendanceQuerySchema } from './attendance.schema.js'

export class AttendanceController {
  constructor(private readonly service: AttendanceService) {}

  checkIn = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      response.status(201).json(await this.service.checkIn(request.body, request.user!))
    } catch (error: unknown) { next(error) }
  }

  checkOut = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = attendanceIdSchema.parse(request.params)
      response.json(await this.service.checkOut(id, request.user!))
    } catch (error: unknown) { next(error) }
  }

  list = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      response.json(await this.service.list(attendanceQuerySchema.parse(request.query), request.user!))
    } catch (error: unknown) { next(error) }
  }
}
