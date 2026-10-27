import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm'
import { Coach } from '../coaches/coach.entity.js'
import { ClientRoutine } from './client-routine.entity.js'
import { RoutineExercise } from './routine-exercise.entity.js'
import { RoutineLevel } from './routine.enums.js'

@Entity({ name: 'routine' })
export class Routine {
  @PrimaryGeneratedColumn()
  id!: number

  @Column({ type: 'varchar', length: 100 })
  name!: string

  @Column({ type: 'text', nullable: true })
  description!: string | null

  @Column({ type: 'enum', enum: RoutineLevel, enumName: 'routine_level' })
  level!: RoutineLevel

  @Column({ name: 'created_by', type: 'integer' })
  createdById!: number

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date

  @ManyToOne(() => Coach, (coach) => coach.routines)
  @JoinColumn({ name: 'created_by' })
  creator!: Coach

  @OneToMany(() => RoutineExercise, (routineExercise) => routineExercise.routine)
  exercises?: RoutineExercise[]

  @OneToMany(() => ClientRoutine, (assignment) => assignment.routine)
  clientAssignments?: ClientRoutine[]
}
