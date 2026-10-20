import type { Repository } from 'typeorm'
import { Client } from './client.entity.js'
import type { CreateClientInput } from './types.js'

export interface ClientsRepository {
  getModuleName(): 'clients'
  findByEmail(email: string): Promise<Client | null>
  findByDni(dni: string): Promise<Client | null>
  create(input: CreateClientInput): Promise<Client>
}

export class TypeOrmClientsRepository implements ClientsRepository {
  constructor(private readonly repository: Repository<Client>) {}

  getModuleName(): 'clients' {
    return 'clients'
  }

  findByEmail(email: string): Promise<Client | null> {
    return this.repository.findOne({ where: { email } })
  }

  findByDni(dni: string): Promise<Client | null> {
    return this.repository.findOne({ where: { dni } })
  }

  async create(input: CreateClientInput): Promise<Client> {
    const client = this.repository.create({
      ...input,
      isActive: true,
    })

    return this.repository.save(client)
  }
}
