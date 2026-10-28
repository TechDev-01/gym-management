import { Check, Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { Coach } from './coach.entity.js'

@Entity({ name: 'coach_schedule' })
@Index(['coachId', 'dayOfWeek', 'startTime'], { unique: true })
@Check('"day_of_week" >= 1 AND "day_of_week" <= 7')
@Check('"start_time" < "end_time"')
export class CoachSchedule {
  @PrimaryGeneratedColumn()
  id!: number

  @Column({ name: 'coach_id', type: 'integer' })
  coachId!: number

  @Column({ name: 'day_of_week', type: 'smallint' })
  dayOfWeek!: number

  @Column({ name: 'start_time', type: 'time' })
  startTime!: string

  @Column({ name: 'end_time', type: 'time' })
  endTime!: string

  @ManyToOne(() => Coach, (coach) => coach.schedules)
  @JoinColumn({ name: 'coach_id' })
  coach!: Coach
}
