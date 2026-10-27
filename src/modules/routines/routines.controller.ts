import type { NextFunction, Request, Response } from 'express'
import type { RoutinesService } from './routines.service.js'
import { routineStatusSchema } from './routines.schema.js'

export class RoutinesController {
  constructor(private readonly service: RoutinesService) {}

  listExercises = async (_request: Request, response: Response, next: NextFunction): Promise<void> => {
    try { response.json(await this.service.listExercises()) } catch (error: unknown) { next(error) }
  }

  getExercise = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try { response.json(await this.service.getExercise(request.params.id)) } catch (error: unknown) { next(error) }
  }

  createExercise = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try { response.status(201).json(await this.service.createExercise(request.body)) } catch (error: unknown) { next(error) }
  }

  updateExercise = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try { response.json(await this.service.updateExercise(request.params.id, request.body)) } catch (error: unknown) { next(error) }
  }

  listRoutines = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try { response.json(await this.service.listRoutines(request.query, request.user!)) } catch (error: unknown) { next(error) }
  }

  getRoutine = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try { response.json(await this.service.getRoutine(request.params.id, request.user!)) } catch (error: unknown) { next(error) }
  }

  createRoutine = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try { response.status(201).json(await this.service.createRoutine(request.body, request.user!)) } catch (error: unknown) { next(error) }
  }

  updateRoutine = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try { response.json(await this.service.updateRoutine(request.params.id, request.body, request.user!)) } catch (error: unknown) { next(error) }
  }

  setRoutineStatus = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      const { isActive } = routineStatusSchema.parse(request.body)
      response.json(await this.service.setRoutineStatus(request.params.id, isActive, request.user!))
    } catch (error: unknown) { next(error) }
  }

  addRoutineExercise = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try { response.status(201).json(await this.service.addRoutineExercise(request.params.id, request.body, request.user!)) } catch (error: unknown) { next(error) }
  }

  updateRoutineExercise = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      response.json(await this.service.updateRoutineExercise(request.params, request.body, request.user!))
    } catch (error: unknown) { next(error) }
  }

  deleteRoutineExercise = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      await this.service.deleteRoutineExercise(request.params, request.user!)
      response.status(204).send()
    } catch (error: unknown) { next(error) }
  }

  listAssignments = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try { response.json(await this.service.listAssignments(request.query, request.user!)) } catch (error: unknown) { next(error) }
  }

  getAssignment = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try { response.json(await this.service.getAssignment(request.params.id, request.user!)) } catch (error: unknown) { next(error) }
  }

  createAssignment = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try { response.status(201).json(await this.service.createAssignment(request.body, request.user!)) } catch (error: unknown) { next(error) }
  }

  updateAssignmentStatus = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try { response.json(await this.service.updateAssignmentStatus(request.params.id, request.body, request.user!)) } catch (error: unknown) { next(error) }
  }
}
