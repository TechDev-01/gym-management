import { Check, Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm'
import { Subscription } from './subscription.entity.js'

@Entity({ name: 'membership' })
@Check('"duration_days" > 0')
export class Membership {
  @PrimaryGeneratedColumn()
  id!: number

  @Column({ type: 'varchar', length: 50, unique: true })
  name!: string

  @Column({ name: 'duration_days', type: 'integer' })
  durationDays!: number

  @Column({ name: 'max_days_per_week', type: 'smallint', nullable: true })
  maxDaysPerWeek!: number | null

  @Column({ name: 'price_amount', type: 'integer' })
  priceAmount!: number

  @Column({ type: 'char', length: 3, default: 'usd' })
  currency!: string

  @Column({ name: 'stripe_product_id', type: 'varchar', length: 255, unique: true, nullable: true })
  stripeProductId!: string | null

  @Column({ name: 'stripe_price_id', type: 'varchar', length: 255, unique: true, nullable: true })
  stripePriceId!: string | null

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean

  @OneToMany(() => Subscription, (subscription) => subscription.membership)
  subscriptions?: Subscription[]
}
