import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm'
import { AppUser } from '../auth/app-user.entity.js'
import { Attendance } from '../attendance/attendance.entity.js'
import { ClientRoutine } from '../routines/client-routine.entity.js'
import { Payment } from '../payments/payment.entity.js'
import { ProgressRecord } from '../progress/progress-record.entity.js'
import { Subscription } from '../memberships/subscription.entity.js'

@Entity({ name: 'client' })
export class Client {
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

  @Column({ name: 'stripe_customer_id', type: 'varchar', length: 255, unique: true, nullable: true })
  stripeCustomerId!: string | null

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date

  @OneToOne(() => AppUser, (user) => user.client)
  user?: AppUser

  @OneToMany(() => Subscription, (subscription) => subscription.client)
  subscriptions?: Subscription[]

  @OneToMany(() => Payment, (payment) => payment.client)
  payments?: Payment[]

  @OneToMany(() => Attendance, (attendance) => attendance.client)
  attendances?: Attendance[]

  @OneToMany(() => ClientRoutine, (assignment) => assignment.client)
  routines?: ClientRoutine[]

  @OneToMany(() => ProgressRecord, (record) => record.client)
  progressRecords?: ProgressRecord[]
}
