import type { Repository } from 'typeorm'
import type { Page, PaginationQuery } from '../../shared/pagination.js'
import { AppUser, UserRole } from '../auth/app-user.entity.js'
import { Coach } from './coach.entity.js'
import type { CreateCoachInput, UpdateCoachInput } from './types.js'

export interface CoachesRepository {
  getModuleName(): 'coaches'
  create(input: CreateCoachInput): Promise<Coach>
  createWithCredentials?(
    input: Omit<CreateCoachInput, 'password'>,
    passwordHash: string,
  ): Promise<Coach>
  getCoaches(query: PaginationQuery): Promise<Page<Coach>>
  getCoach(id: number): Promise<Coach | null>
  updateCoaches(id: number, input: UpdateCoachInput): Promise<Coach | null>
  findByEmail(email: string): Promise<Coach | null>
  findAppUserByEmail(email: string): Promise<AppUser | null>
  findByDni(dni: string): Promise<Coach | null>
}

export class TypeOrmCoachesRepository implements CoachesRepository {
  constructor(private readonly repository: Repository<Coach>) {}

  getModuleName(): 'coaches' {
    return 'coaches'
  }

  async create(input: CreateCoachInput): Promise<Coach> {
    const { password: _password, ...coachData } = input
    const coach = this.repository.create({
      ...coachData,
      isActive: true,
    })

    return this.repository.save(coach)
  }

  async createWithCredentials(
    input: Omit<CreateCoachInput, 'password'>,
    passwordHash: string,
  ): Promise<Coach> {
    return this.repository.manager.transaction(async (manager) => {
      const coach = manager.create(Coach, {
        ...input,
        isActive: true,
      })
      const savedCoach = await manager.save(coach)

      if (!savedCoach.email) {
        throw new Error('A coach email is required to create login credentials')
      }

      const user = manager.create(AppUser, {
        email: savedCoach.email,
        passwordHash,
        role: UserRole.COACH,
        clientId: null,
        coachId: savedCoach.id,
        isActive: true,
        lastLoginAt: null,
      })
      await manager.save(user)

      return savedCoach
    })
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

  findAppUserByEmail(email: string): Promise<AppUser | null> {
    return this.repository.manager.findOne(AppUser, { where: { email } })
  }

  findByDni(dni: string): Promise<Coach | null> {
    return this.repository.findOne({ where: { dni } })
  }

  async updateCoaches(
    id: number,
    input: UpdateCoachInput,
  ): Promise<Coach | null> {
    return this.repository.manager.transaction(async (manager) => {
      const coach = await manager.preload(Coach, { id, ...input })

      if (!coach) {
        return null
      }

      const savedCoach = await manager.save(coach)

      if (input.email) {
        await manager.update(
          AppUser,
          { coachId: id },
          { email: input.email },
        )
      }

      return savedCoach
    })
  }
}
