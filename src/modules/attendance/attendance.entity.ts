import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm'
import { AppUser } from '../auth/app-user.entity.js'
import { Client } from '../clients/client.entity.js'
import { Subscription } from '../memberships/subscription.entity.js'

@Entity({ name: 'attendance' })
@Index(['clientId', 'checkInAt'])
export class Attendance {
  @PrimaryGeneratedColumn()
  id!: number

  @Column({ name: 'client_id', type: 'integer' })
  clientId!: number

  @Column({ name: 'subscription_id', type: 'integer' })
  subscriptionId!: number

  @CreateDateColumn({ name: 'check_in_at', type: 'timestamptz' })
  checkInAt!: Date

  @Column({ name: 'check_out_at', type: 'timestamptz', nullable: true })
  checkOutAt!: Date | null

  @Column({ name: 'recorded_by', type: 'integer', nullable: true })
  recordedById!: number | null

  @ManyToOne(() => Client, (client) => client.attendances)
  @JoinColumn({ name: 'client_id' })
  client!: Client

  @ManyToOne(() => Subscription)
  @JoinColumn({ name: 'subscription_id' })
  subscription!: Subscription

  @ManyToOne(() => AppUser)
  @JoinColumn({ name: 'recorded_by' })
  recordedBy?: AppUser
}
