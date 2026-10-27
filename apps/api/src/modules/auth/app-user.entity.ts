import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm'
import { Client } from '../clients/client.entity.js'
import { Coach } from '../coaches/coach.entity.js'

export enum UserRole {
  ADMIN = 'ADMIN',
  RECEPTION = 'RECEPTION',
  COACH = 'COACH',
  CLIENT = 'CLIENT',
}

@Entity({ name: 'app_user' })
@Check(`"client_id" IS NULL OR "coach_id" IS NULL`)
export class AppUser {
  @PrimaryGeneratedColumn()
  id!: number

  @Column({ type: 'varchar', length: 100, unique: true })
  email!: string

  @Column({ name: 'password_hash', type: 'text' })
  passwordHash!: string

  @Column({ type: 'enum', enum: UserRole, enumName: 'user_role' })
  role!: UserRole

  @Column({ name: 'client_id', type: 'integer', unique: true, nullable: true })
  clientId!: number | null

  @Column({ name: 'coach_id', type: 'integer', unique: true, nullable: true })
  coachId!: number | null

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean

  @Column({ name: 'last_login_at', type: 'timestamptz', nullable: true })
  lastLoginAt!: Date | null

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date

  @OneToOne(() => Client, (client) => client.user)
  @JoinColumn({ name: 'client_id' })
  client?: Client

  @OneToOne(() => Coach, (coach) => coach.user)
  @JoinColumn({ name: 'coach_id' })
  coach?: Coach
}
