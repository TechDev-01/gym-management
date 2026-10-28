import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { Client } from '../clients/client.entity.js'
import { Coach } from '../coaches/coach.entity.js'
import { Routine } from './routine.entity.js'
import { AssignmentStatus } from './routine.enums.js'

@Entity({ name: 'client_routine' })
@Index(['clientId', 'status'])
export class ClientRoutine {
  @PrimaryGeneratedColumn()
  id!: number

  @Column({ name: 'client_id', type: 'integer' })
  clientId!: number

  @Column({ name: 'routine_id', type: 'integer' })
  routineId!: number

  @Column({ name: 'assigned_by', type: 'integer' })
  assignedById!: number

  @Column({
    type: 'enum',
    enum: AssignmentStatus,
    enumName: 'assignment_status',
    default: AssignmentStatus.ACTIVE,
  })
  status!: AssignmentStatus

  @Column({ name: 'start_date', type: 'date' })
  startDate!: string

  @Column({ name: 'end_date', type: 'date', nullable: true })
  endDate!: string | null

  @Column({ type: 'text', nullable: true })
  notes!: string | null

  @ManyToOne(() => Client, (client) => client.routines)
  @JoinColumn({ name: 'client_id' })
  client!: Client

  @ManyToOne(() => Routine, (routine) => routine.clientAssignments)
  @JoinColumn({ name: 'routine_id' })
  routine!: Routine

  @ManyToOne(() => Coach, (coach) => coach.routineAssignments)
  @JoinColumn({ name: 'assigned_by' })
  assignedBy!: Coach
}
