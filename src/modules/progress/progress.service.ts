import { ForbiddenError } from '../../shared/errors/forbidden.error.js'
import { NotFoundError } from '../../shared/errors/not-found.error.js'
import type { ProgressRepository } from './progress.repository.js'
import { createProgressSchema, progressIdSchema, progressQuerySchema } from './progress.schema.js'
import type { ProgressPage, UserContext } from './types.js'
import { toProgressResponse } from './types.js'

export class ProgressService {
  constructor(private readonly repository: ProgressRepository) {}

  async create(input: unknown, user: UserContext): Promise<ReturnType<typeof toProgressResponse>> {
    const data = createProgressSchema.parse(input)
    const clientId = user.role === 'CLIENT' ? user.clientId : data.clientId
    if (!clientId) throw new NotFoundError('Client not found')

    const client = await this.repository.findClient(clientId)
    if (!client || !client.isActive) throw new NotFoundError('Active client not found')

    const coachId = user.role === 'COACH' ? user.coachId : null
    return toProgressResponse(await this.repository.create({
      ...data,
      clientId,
      recordedById: coachId,
    }))
  }

  async list(input: unknown, user: UserContext): Promise<ProgressPage> {
    const query = progressQuerySchema.parse(input)
    const clientId = user.role === 'CLIENT' ? user.clientId ?? -1 : query.clientId
    const result = await this.repository.list({ ...query, clientId })
    return {
      items: result.items.map(toProgressResponse),
      page: query.page,
      limit: query.limit,
      total: result.total,
    }
  }

  async get(inputId: unknown, user: UserContext): Promise<ReturnType<typeof toProgressResponse>> {
    const { id } = progressIdSchema.parse({ id: inputId })
    const record = await this.repository.findById(id)
    if (!record) throw new NotFoundError('Progress record not found')
    if (user.role === 'CLIENT' && user.clientId !== record.clientId) throw new ForbiddenError()
    return toProgressResponse(record)
  }
}
