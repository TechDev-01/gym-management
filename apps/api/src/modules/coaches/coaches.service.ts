import type { CoachesRepository } from './coaches.repository.js'
import { ConflictError } from '../../shared/errors/conflict.error.js'
import { NotFoundError } from '../../shared/errors/not-found.error.js'
import {
  coachIdSchema,
  coachesHealthSchema,
  createCoachSchema,
  updateCoachSchema,
} from './coaches.schema.js'
import type { CoachResponse, CoachesHealthResponse } from './types.js'

export class CoachesService {
  constructor(private readonly coachesRepository: CoachesRepository) {}

  health(): CoachesHealthResponse {
    return coachesHealthSchema.parse({
      status: 'ok',
      module: this.coachesRepository.getModuleName(),
    })
  }

  async register(input: unknown): Promise<CoachResponse> {
    const coachInput = createCoachSchema.parse(input)

    if (await this.coachesRepository.findByEmail(coachInput.email)) {
      throw new ConflictError('Email is already registered')
    }

    if (await this.coachesRepository.findByDni(coachInput.dni)) {
      throw new ConflictError('DNI is already registered')
    }

    const coach = await this.coachesRepository.create(coachInput)

    return this.toCoachResponse(coach)
  }

  async getCoaches(): Promise<CoachResponse[]> {
    const coaches = await this.coachesRepository.getCoaches()
    return coaches.map((coach) => this.toCoachResponse(coach))
  }

  async getCoach(inputId: unknown): Promise<CoachResponse> {
    const id = coachIdSchema.parse(inputId)
    const coach = await this.coachesRepository.getCoach(id)

    if (!coach) {
      throw new NotFoundError('Coach not found')
    }

    return this.toCoachResponse(coach)
  }

  async updateCoach(
    inputId: unknown,
    input: unknown,
  ): Promise<CoachResponse> {
    const id = coachIdSchema.parse(inputId)
    const coachInput = updateCoachSchema.parse(input)
    const existingCoach = await this.coachesRepository.getCoach(id)

    if (!existingCoach) {
      throw new NotFoundError('Coach not found')
    }

    if (
      coachInput.email &&
      coachInput.email !== existingCoach.email &&
      (await this.coachesRepository.findByEmail(coachInput.email))
    ) {
      throw new ConflictError('Email is already registered')
    }

    if (
      coachInput.dni &&
      coachInput.dni !== existingCoach.dni &&
      (await this.coachesRepository.findByDni(coachInput.dni))
    ) {
      throw new ConflictError('DNI is already registered')
    }

    const coach = await this.coachesRepository.updateCoaches(id, coachInput)

    if (!coach) {
      throw new NotFoundError('Coach not found')
    }

    return this.toCoachResponse(coach)
  }

  private toCoachResponse(coach: {
    id: number
    email: string | null
    dni: string
    name: string
    lastName: string
    phone: string
    isActive: boolean
  }): CoachResponse {
    return {
      id: coach.id,
      email: coach.email ?? '',
      dni: coach.dni,
      name: coach.name,
      lastName: coach.lastName,
      phone: coach.phone,
      isActive: coach.isActive,
    }
  }
}
