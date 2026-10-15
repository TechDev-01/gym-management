import { Check, Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { Exercise } from './exercise.entity.js'
import { Routine } from './routine.entity.js'

@Entity({ name: 'routine_exercise' })
@Index(['routineId', 'dayNumber', 'position'], { unique: true })
@Check('"sets" > 0')
@Check('"reps" > 0')
export class RoutineExercise {
  @PrimaryGeneratedColumn()
  id!: number

  @Column({ name: 'routine_id', type: 'integer' })
  routineId!: number

  @Column({ name: 'exercise_id', type: 'integer' })
  exerciseId!: number

  @Column({ name: 'day_number', type: 'smallint' })
  dayNumber!: number

  @Column({ type: 'smallint' })
  position!: number

  @Column({ type: 'smallint' })
  sets!: number

  @Column({ type: 'smallint' })
  reps!: number

  @Column({ name: 'weight_kg', type: 'numeric', precision: 5, scale: 2, nullable: true })
  weightKg!: string | null

  @Column({ name: 'rest_seconds', type: 'smallint', nullable: true })
  restSeconds!: number | null

  @Column({ type: 'text', nullable: true })
  notes!: string | null

  @ManyToOne(() => Routine, (routine) => routine.exercises)
  @JoinColumn({ name: 'routine_id' })
  routine!: Routine

  @ManyToOne(() => Exercise, (exercise) => exercise.routineExercises)
  @JoinColumn({ name: 'exercise_id' })
  exercise!: Exercise
}
