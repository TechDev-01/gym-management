import type { Repository } from 'typeorm'
import { CoachSchedule } from './coach-schedule.entity.js'
import type {
  CreateCoachScheduleInput,
  UpdateCoachScheduleInput,
} from './types.js'

export interface CoachSchedulesRepository {
  listByCoach(coachId: number): Promise<CoachSchedule[]>
  listByCoachAndDay(coachId: number, dayOfWeek: number): Promise<CoachSchedule[]>
  findById(coachId: number, scheduleId: number): Promise<CoachSchedule | null>
  findBySlot(
    coachId: number,
    dayOfWeek: number,
    startTime: string,
  ): Promise<CoachSchedule | null>
  create(input: CreateCoachScheduleInput & { coachId: number }): Promise<CoachSchedule>
  update(
    scheduleId: number,
    input: UpdateCoachScheduleInput,
  ): Promise<CoachSchedule | null>
  deleteById(scheduleId: number): Promise<boolean>
}

export class TypeOrmCoachSchedulesRepository implements CoachSchedulesRepository {
  constructor(private readonly repository: Repository<CoachSchedule>) {}

  listByCoach(coachId: number): Promise<CoachSchedule[]> {
    return this.repository.find({
      where: { coachId },
      order: { dayOfWeek: 'ASC', startTime: 'ASC' },
    })
  }

  listByCoachAndDay(
    coachId: number,
    dayOfWeek: number,
  ): Promise<CoachSchedule[]> {
    return this.repository.find({
      where: { coachId, dayOfWeek },
      order: { startTime: 'ASC' },
    })
  }

  findById(
    coachId: number,
    scheduleId: number,
  ): Promise<CoachSchedule | null> {
    return this.repository.findOne({ where: { id: scheduleId, coachId } })
  }

  findBySlot(
    coachId: number,
    dayOfWeek: number,
    startTime: string,
  ): Promise<CoachSchedule | null> {
    return this.repository.findOne({
      where: { coachId, dayOfWeek, startTime },
    })
  }

  create(
    input: CreateCoachScheduleInput & { coachId: number },
  ): Promise<CoachSchedule> {
    return this.repository.save(this.repository.create(input))
  }

  async update(
    scheduleId: number,
    input: UpdateCoachScheduleInput,
  ): Promise<CoachSchedule | null> {
    const schedule = await this.repository.preload({ id: scheduleId, ...input })

    if (!schedule) {
      return null
    }

    return this.repository.save(schedule)
  }

  async deleteById(scheduleId: number): Promise<boolean> {
    const result = await this.repository.delete({ id: scheduleId })
    return (result.affected ?? 0) > 0
  }
}
