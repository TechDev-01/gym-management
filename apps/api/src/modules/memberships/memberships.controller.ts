import type { NextFunction, Request, Response } from 'express'
import type { MembershipsService } from './memberships.service.js'
import {
  membershipIdSchema,
  subscriptionIdSchema,
  subscriptionQuerySchema,
} from './memberships.schema.js'

export class MembershipsController {
  constructor(private readonly service: MembershipsService) {}

  listMemberships = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      response.json(await this.service.listMemberships(request.query.includeInactive === 'true'))
    } catch (error: unknown) { next(error) }
  }

  getMembership = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = membershipIdSchema.parse(request.params)
      response.json(await this.service.getMembership(id))
    } catch (error: unknown) { next(error) }
  }

  createMembership = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      response.status(201).json(await this.service.createMembership(request.body))
    } catch (error: unknown) { next(error) }
  }

  updateMembership = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = membershipIdSchema.parse(request.params)
      response.json(await this.service.updateMembership(id, request.body))
    } catch (error: unknown) { next(error) }
  }

  setMembershipStatus = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = membershipIdSchema.parse(request.params)
      response.json(await this.service.setMembershipStatus(id, request.body, request.user?.role ?? ''))
    } catch (error: unknown) { next(error) }
  }

  createSubscription = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = membershipIdSchema.parse(request.params)
      response.status(201).json(await this.service.createSubscription(
        { ...request.body, membershipId: id },
        request.user!,
      ))
    } catch (error: unknown) { next(error) }
  }

  listSubscriptions = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      const query = subscriptionQuerySchema.parse(request.query)
      response.json(await this.service.listSubscriptions(query, request.user!))
    } catch (error: unknown) { next(error) }
  }

  getSubscription = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = subscriptionIdSchema.parse(request.params)
      response.json(await this.service.getSubscription(id, request.user!))
    } catch (error: unknown) { next(error) }
  }

  cancelSubscription = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = subscriptionIdSchema.parse(request.params)
      response.json(await this.service.cancelSubscription(id, request.user!))
    } catch (error: unknown) { next(error) }
  }

  confirmManualPayment = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = subscriptionIdSchema.parse(request.params)
      response.json(await this.service.confirmManualPayment(id, request.user!))
    } catch (error: unknown) { next(error) }
  }
}
