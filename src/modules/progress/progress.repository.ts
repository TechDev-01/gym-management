import type { Repository } from 'typeorm'
import { Client } from '../clients/client.entity.js'
import { ProgressRecord } from './progress-record.entity.js'
import type { CreateProgressInput, ProgressFilters } from './types.js'

export interface ProgressRepository {
  findClient(id: number): Promise<Client | null>
  create(input: CreateProgressInput & { recordedById: number | null }): Promise<ProgressRecord>
  findById(id: number): Promise<ProgressRecord | null>
  list(filters: ProgressFilters): Promise<{ items: ProgressRecord[]; total: number }>
}

export class TypeOrmProgressRepository implements ProgressRepository {
  constructor(
    private readonly progressRepository: Repository<ProgressRecord>,
    private readonly clientRepository: Repository<Client>,
  ) {}

  findClient(id: number): Promise<Client | null> {
    return this.clientRepository.findOneBy({ id })
  }

  create(input: CreateProgressInput & { recordedById: number | null }): Promise<ProgressRecord> {
    return this.progressRepository.save(this.progressRepository.create({
      ...input,
      weightKg: input.weightKg?.toString() ?? null,
      heightCm: input.heightCm?.toString() ?? null,
      bodyFatPct: input.bodyFatPct?.toString() ?? null,
      muscleKg: input.muscleKg?.toString() ?? null,
      chestCm: input.chestCm?.toString() ?? null,
      waistCm: input.waistCm?.toString() ?? null,
      hipCm: input.hipCm?.toString() ?? null,
      armCm: input.armCm?.toString() ?? null,
      thighCm: input.thighCm?.toString() ?? null,
      notes: input.notes ?? null,
    }))
  }

  findById(id: number): Promise<ProgressRecord | null> {
    return this.progressRepository.findOneBy({ id })
  }

  async list(filters: ProgressFilters): Promise<{ items: ProgressRecord[]; total: number }> {
    const query = this.progressRepository.createQueryBuilder('progress')
      .orderBy('progress.measured_at', 'DESC')
      .addOrderBy('progress.id', 'DESC')
      .skip((filters.page - 1) * filters.limit)
      .take(filters.limit)

    if (filters.clientId !== undefined) query.andWhere('progress.client_id = :clientId', { clientId: filters.clientId })
    if (filters.from) query.andWhere('progress.measured_at >= :from', { from: filters.from })
    if (filters.to) query.andWhere('progress.measured_at <= :to', { to: filters.to })

    const [items, total] = await query.getManyAndCount()
    return { items, total }
  }
}
