import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm'
import { Client } from '../clients/client.entity.js'
import { Payment } from '../payments/payment.entity.js'
import { Membership } from './membership.entity.js'

export enum SubscriptionStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
}

@Entity({ name: 'subscription' })
@Index(['clientId', 'status'])
export class Subscription {
  @PrimaryGeneratedColumn()
  id!: number

  @Column({ name: 'client_id', type: 'integer' })
  clientId!: number

  @Column({ name: 'membership_id', type: 'integer' })
  membershipId!: number

  @Column({
    type: 'enum',
    enum: SubscriptionStatus,
    enumName: 'subscription_status',
    default: SubscriptionStatus.PENDING,
  })
  status!: SubscriptionStatus

  @Column({ name: 'start_date', type: 'date', nullable: true })
  startDate!: string | null

  @Column({ name: 'end_date', type: 'date', nullable: true })
  endDate!: string | null

  @Column({ name: 'stripe_subscription_id', type: 'varchar', length: 255, unique: true, nullable: true })
  stripeSubscriptionId!: string | null

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date

  @ManyToOne(() => Client, (client) => client.subscriptions)
  @JoinColumn({ name: 'client_id' })
  client!: Client

  @ManyToOne(() => Membership, (membership) => membership.subscriptions)
  @JoinColumn({ name: 'membership_id' })
  membership!: Membership

  @OneToMany(() => Payment, (payment) => payment.subscription)
  payments?: Payment[]
}
