import {
  Column,
  Check,
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

export enum PaymentMethod {
  CARD = 'CARD',
  CASH = 'CASH',
  TRANSFER = 'TRANSFER',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  SUCCEEDED = 'SUCCEEDED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

@Entity({ name: 'payment' })
@Index(['clientId'])
@Index(['subscriptionId'])
@Check('"refunded_amount" <= "amount"')
export class Payment {
  @PrimaryGeneratedColumn()
  id!: number

  @Column({ name: 'client_id', type: 'integer' })
  clientId!: number

  @Column({ name: 'subscription_id', type: 'integer' })
  subscriptionId!: number

  @Column({ type: 'enum', enum: PaymentMethod, enumName: 'payment_method' })
  method!: PaymentMethod

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    enumName: 'payment_status',
    default: PaymentStatus.PENDING,
  })
  status!: PaymentStatus

  @Column({ type: 'integer' })
  amount!: number

  @Column({ type: 'char', length: 3 })
  currency!: string

  @Column({ name: 'refunded_amount', type: 'integer', default: 0 })
  refundedAmount!: number

  @Column({ name: 'stripe_checkout_session_id', type: 'varchar', length: 255, unique: true, nullable: true })
  stripeCheckoutSessionId!: string | null

  @Column({ name: 'stripe_payment_intent_id', type: 'varchar', length: 255, unique: true, nullable: true })
  stripePaymentIntentId!: string | null

  @Column({ name: 'stripe_invoice_id', type: 'varchar', length: 255, unique: true, nullable: true })
  stripeInvoiceId!: string | null

  @Column({ name: 'receipt_url', type: 'text', nullable: true })
  receiptUrl!: string | null

  @Column({ name: 'recorded_by', type: 'integer', nullable: true })
  recordedById!: number | null

  @Column({ name: 'paid_at', type: 'timestamptz', nullable: true })
  paidAt!: Date | null

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date

  @ManyToOne(() => Client, (client) => client.payments)
  @JoinColumn({ name: 'client_id' })
  client!: Client

  @ManyToOne(() => Subscription, (subscription) => subscription.payments)
  @JoinColumn({ name: 'subscription_id' })
  subscription!: Subscription

  @ManyToOne(() => AppUser)
  @JoinColumn({ name: 'recorded_by' })
  recordedBy?: AppUser
}
