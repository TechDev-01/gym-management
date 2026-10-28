import type { CoachesRepository } from './coaches.repository.js'
import type { CoachSchedulesRepository } from './coach-schedules.repository.js'
import { ConflictError } from '../../shared/errors/conflict.error.js'
import { NotFoundError } from '../../shared/errors/not-found.error.js'
import {
  coachIdSchema,
  coachScheduleIdSchema,
  createCoachScheduleSchema,
  updateCoachScheduleSchema,
} from './coaches.schema.js'
import type {
  CoachScheduleResponse,
  CreateCoachScheduleInput,
} from './types.js'

function toTime(value: string): string {
  return value.slice(0, 5)
}

function overlaps(
  startTime: string,
  endTime: string,
  other: { startTime: string; endTime: string },
): boolean {
  return startTime < toTime(other.endTime) && endTime > toTime(other.startTime)
}

function isUniqueViolation(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) {
    return false
  }

  const driverError = (error as { driverError?: unknown }).driverError

  return (
    typeof driverError === 'object' &&
    driverError !== null &&
    (driverError as { code?: unknown }).code === '23505'
  )
}

export class CoachSchedulesService {
  constructor(
    private readonly coachesRepository: CoachesRepository,
    private readonly schedulesRepository: CoachSchedulesRepository,
  ) {}

  async listSchedules(inputCoachId: unknown): Promise<CoachScheduleResponse[]> {
    const coachId = coachIdSchema.parse(inputCoachId)
    await this.ensureCoachExists(coachId)

    const schedules = await this.schedulesRepository.listByCoach(coachId)
    return schedules.map((schedule) => this.toResponse(schedule))
  }

  async createSchedule(
    inputCoachId: unknown,
    input: unknown,
  ): Promise<CoachScheduleResponse> {
    const coachId = coachIdSchema.parse(inputCoachId)
    const scheduleInput = createCoachScheduleSchema.parse(input)
    await this.ensureCoachExists(coachId)
    await this.assertSlotIsAvailable(coachId, scheduleInput)

    try {
      const schedule = await this.schedulesRepository.create({
        coachId,
        ...scheduleInput,
      })
      return this.toResponse(schedule)
    } catch (error: unknown) {
      if (isUniqueViolation(error)) {
        throw new ConflictError('Coach already has a schedule at this start time')
      }

      throw error
    }
  }

  async updateSchedule(
    inputCoachId: unknown,
    inputScheduleId: unknown,
    input: unknown,
  ): Promise<CoachScheduleResponse> {
    const coachId = coachIdSchema.parse(inputCoachId)
    const scheduleId = coachScheduleIdSchema.parse(inputScheduleId)
    const scheduleInput = updateCoachScheduleSchema.parse(input)
    const existing = await this.schedulesRepository.findById(coachId, scheduleId)

    if (!existing) {
      throw new NotFoundError('Coach schedule not found')
    }

    const mergedInput = createCoachScheduleSchema.parse({
      dayOfWeek: scheduleInput.dayOfWeek ?? existing.dayOfWeek,
      startTime: scheduleInput.startTime ?? toTime(existing.startTime),
      endTime: scheduleInput.endTime ?? toTime(existing.endTime),
    })
    await this.assertSlotIsAvailable(coachId, mergedInput, scheduleId)

    try {
      const schedule = await this.schedulesRepository.update(
        scheduleId,
        mergedInput,
      )

      if (!schedule) {
        throw new NotFoundError('Coach schedule not found')
      }

      return this.toResponse(schedule)
    } catch (error: unknown) {
      if (isUniqueViolation(error)) {
        throw new ConflictError('Coach already has a schedule at this start time')
      }

      throw error
    }
  }

  async deleteSchedule(
    inputCoachId: unknown,
    inputScheduleId: unknown,
  ): Promise<void> {
    const coachId = coachIdSchema.parse(inputCoachId)
    const scheduleId = coachScheduleIdSchema.parse(inputScheduleId)
    const existing = await this.schedulesRepository.findById(coachId, scheduleId)

    if (!existing) {
      throw new NotFoundError('Coach schedule not found')
    }

    await this.schedulesRepository.deleteById(scheduleId)
  }

  private async ensureCoachExists(coachId: number): Promise<void> {
    if (!(await this.coachesRepository.getCoach(coachId))) {
      throw new NotFoundError('Coach not found')
    }
  }

  private async assertSlotIsAvailable(
    coachId: number,
    input: CreateCoachScheduleInput,
    excludeScheduleId?: number,
  ): Promise<void> {
    const duplicate = await this.schedulesRepository.findBySlot(
      coachId,
      input.dayOfWeek,
      input.startTime,
    )

    if (duplicate && duplicate.id !== excludeScheduleId) {
      throw new ConflictError('Coach already has a schedule at this start time')
    }

    const sameDay = await this.schedulesRepository.listByCoachAndDay(
      coachId,
      input.dayOfWeek,
    )
    const overlapping = sameDay.find(
      (schedule) =>
        schedule.id !== excludeScheduleId &&
        overlaps(input.startTime, input.endTime, schedule),
    )

    if (overlapping) {
      throw new ConflictError('Coach schedule overlaps an existing slot')
    }
  }

  private toResponse(schedule: {
    id: number
    coachId: number
    dayOfWeek: number
    startTime: string
    endTime: string
  }): CoachScheduleResponse {
    return {
      id: schedule.id,
      coachId: schedule.coachId,
      dayOfWeek: schedule.dayOfWeek,
      startTime: toTime(schedule.startTime),
      endTime: toTime(schedule.endTime),
    }
  }
}
