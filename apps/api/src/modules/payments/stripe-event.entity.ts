import { Column, Entity, PrimaryColumn } from 'typeorm'

@Entity({ name: 'stripe_event' })
export class StripeEvent {
  @PrimaryColumn({ type: 'varchar', length: 255 })
  id!: string

  @Column({ type: 'varchar', length: 100 })
  type!: string

  @Column({ type: 'jsonb' })
  payload!: Record<string, unknown>

  @Column({ name: 'received_at', type: 'timestamptz', default: () => 'now()' })
  receivedAt!: Date

  @Column({ name: 'processed_at', type: 'timestamptz', nullable: true })
  processedAt!: Date | null

  @Column({ type: 'text', nullable: true })
  error!: string | null
}
