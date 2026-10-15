import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm'
import { MuscleGroup } from './routine.enums.js'
import { RoutineExercise } from './routine-exercise.entity.js'

@Entity({ name: 'exercise' })
export class Exercise {
  @PrimaryGeneratedColumn()
  id!: number

  @Column({ type: 'varchar', length: 100, unique: true })
  name!: string

  @Column({ name: 'muscle_group', type: 'enum', enum: MuscleGroup, enumName: 'muscle_group' })
  muscleGroup!: MuscleGroup

  @Column({ type: 'varchar', length: 100, nullable: true })
  equipment!: string | null

  @Column({ type: 'text', nullable: true })
  description!: string | null

  @OneToMany(() => RoutineExercise, (routineExercise) => routineExercise.exercise)
  routineExercises?: RoutineExercise[]
}
