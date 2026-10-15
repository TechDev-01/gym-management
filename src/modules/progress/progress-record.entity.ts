import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { Client } from '../clients/client.entity.js'
import { Coach } from '../coaches/coach.entity.js'

@Entity({ name: 'progress_record' })
@Index(['clientId', 'measuredAt'])
export class ProgressRecord {
  @PrimaryGeneratedColumn()
  id!: number

  @Column({ name: 'client_id', type: 'integer' })
  clientId!: number

  @Column({ name: 'recorded_by', type: 'integer', nullable: true })
  recordedById!: number | null

  @Column({ name: 'measured_at', type: 'date' })
  measuredAt!: string

  @Column({ name: 'weight_kg', type: 'numeric', precision: 5, scale: 2, nullable: true })
  weightKg!: string | null

  @Column({ name: 'height_cm', type: 'numeric', precision: 5, scale: 2, nullable: true })
  heightCm!: string | null

  @Column({ name: 'body_fat_pct', type: 'numeric', precision: 4, scale: 1, nullable: true })
  bodyFatPct!: string | null

  @Column({ name: 'muscle_kg', type: 'numeric', precision: 5, scale: 2, nullable: true })
  muscleKg!: string | null

  @Column({ name: 'chest_cm', type: 'numeric', precision: 5, scale: 2, nullable: true })
  chestCm!: string | null

  @Column({ name: 'waist_cm', type: 'numeric', precision: 5, scale: 2, nullable: true })
  waistCm!: string | null

  @Column({ name: 'hip_cm', type: 'numeric', precision: 5, scale: 2, nullable: true })
  hipCm!: string | null

  @Column({ name: 'arm_cm', type: 'numeric', precision: 5, scale: 2, nullable: true })
  armCm!: string | null

  @Column({ name: 'thigh_cm', type: 'numeric', precision: 5, scale: 2, nullable: true })
  thighCm!: string | null

  @Column({ type: 'text', nullable: true })
  notes!: string | null

  @ManyToOne(() => Client, (client) => client.progressRecords)
  @JoinColumn({ name: 'client_id' })
  client!: Client

  @ManyToOne(() => Coach, (coach) => coach.progressRecords)
  @JoinColumn({ name: 'recorded_by' })
  recordedBy?: Coach
}
