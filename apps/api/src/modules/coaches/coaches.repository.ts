import type { Repository } from 'typeorm'
import type { Page, PaginationQuery } from '../../shared/pagination.js'
import { Coach } from './coach.entity.js'
import type { CreateCoachInput, UpdateCoachInput } from './types.js'

export interface CoachesRepository {
  getModuleName(): 'coaches'
  create(input: CreateCoachInput): Promise<Coach>
  getCoaches(query: PaginationQuery): Promise<Page<Coach>>
  getCoach(id: number): Promise<Coach | null>
  updateCoaches(id: number, input: UpdateCoachInput): Promise<Coach | null>
  findByEmail(email: string): Promise<Coach | null>
  findByDni(dni: string): Promise<Coach | null>
}

export class TypeOrmCoachesRepository implements CoachesRepository {
  constructor(private readonly repository: Repository<Coach>) {}

  getModuleName(): 'coaches' {
    return 'coaches'
  }

  async create(input: CreateCoachInput): Promise<Coach> {
    const coach = this.repository.create({
      ...input,
      isActive: true,
    })

    return this.repository.save(coach)
  }

  async getCoaches(query: PaginationQuery): Promise<Page<Coach>> {
    const [items, total] = await this.repository.findAndCount({
      order: { id: 'ASC' },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    })
    return { items, page: query.page, limit: query.limit, total }
  }

  getCoach(id: number): Promise<Coach | null> {
    return this.repository.findOne({ where: { id } })
  }

  findByEmail(email: string): Promise<Coach | null> {
    return this.repository.findOne({ where: { email } })
  }

  findByDni(dni: string): Promise<Coach | null> {
    return this.repository.findOne({ where: { dni } })
  }

  async updateCoaches(
    id: number,
    input: UpdateCoachInput,
  ): Promise<Coach | null> {
    const coach = await this.repository.preload({ id, ...input })

    if (!coach) {
      return null
    }

    return this.repository.save(coach)
  }
}
