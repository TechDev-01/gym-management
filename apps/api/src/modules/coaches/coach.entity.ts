import { Column, Entity, OneToMany, OneToOne, PrimaryGeneratedColumn } from 'typeorm'
import { AppUser } from '../auth/app-user.entity.js'
import { CoachSchedule } from './coach-schedule.entity.js'
import { Routine } from '../routines/routine.entity.js'
import { ClientRoutine } from '../routines/client-routine.entity.js'
import { ProgressRecord } from '../progress/progress-record.entity.js'

@Entity({ name: 'coach' })
export class Coach {
  @PrimaryGeneratedColumn()
  id!: number

  @Column({ type: 'varchar', length: 100 })
  name!: string

  @Column({ name: 'last_name', type: 'varchar', length: 100 })
  lastName!: string

  @Column({ type: 'varchar', length: 20, unique: true })
  dni!: string

  @Column({ type: 'varchar', length: 20, unique: true })
  phone!: string

  @Column({ type: 'varchar', length: 100, unique: true, nullable: true })
  email!: string | null

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean

  @OneToOne(() => AppUser, (user) => user.coach)
  user?: AppUser

  @OneToMany(() => CoachSchedule, (schedule) => schedule.coach)
  schedules?: CoachSchedule[]

  @OneToMany(() => Routine, (routine) => routine.creator)
  routines?: Routine[]

  @OneToMany(() => ClientRoutine, (assignment) => assignment.assignedBy)
  routineAssignments?: ClientRoutine[]

  @OneToMany(() => ProgressRecord, (record) => record.recordedBy)
  progressRecords?: ProgressRecord[]
}
