import type { Repository } from 'typeorm'
import { AppUser, UserRole } from '../auth/app-user.entity.js'
import { Client } from './client.entity.js'
import type { CreateClientInput, UpdateClientInput } from './types.js'

export interface ClientsRepository {
  getModuleName(): 'clients'
  findByEmail(email: string): Promise<Client | null>
  findByDni(dni: string): Promise<Client | null>
  create(input: CreateClientInput): Promise<Client>
  createWithCredentials?(
    input: Omit<CreateClientInput, 'password'>,
    passwordHash: string,
  ): Promise<Client>
  getClients(): Promise<Client[]>
  getClient(id: number): Promise<Client | null>
  updateClient(id: number, input: UpdateClientInput): Promise<Client | null>
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
    const { password: _password, ...clientData } = input
    const client = this.repository.create({
      ...clientData,
      isActive: true,
    })

    return this.repository.save(client)
  }

  async createWithCredentials(
    input: Omit<CreateClientInput, 'password'>,
    passwordHash: string,
  ): Promise<Client> {
    return this.repository.manager.transaction(async (manager) => {
      const client = manager.create(Client, {
        ...input,
        isActive: true,
      })
      const savedClient = await manager.save(client)

      if (!savedClient.email) {
        throw new Error('A client email is required to create login credentials')
      }

      const user = manager.create(AppUser, {
        email: savedClient.email,
        passwordHash,
        role: UserRole.CLIENT,
        clientId: savedClient.id,
        coachId: null,
        isActive: true,
        lastLoginAt: null,
      })
      await manager.save(user)

      return savedClient
    })
  }

  getClients(): Promise<Client[]> {
    return this.repository.find({ order: { id: 'ASC' } })
  }

  getClient(id: number): Promise<Client | null> {
    return this.repository.findOne({ where: { id } })
  }

  async updateClient(id: number, input: UpdateClientInput): Promise<Client | null> {
    return this.repository.manager.transaction(async (manager) => {
      const client = await manager.preload(Client, { id, ...input })

      if (!client) {
        return null
      }

      const savedClient = await manager.save(client)

      if (input.email) {
        await manager.update(
          AppUser,
          { clientId: id },
          { email: input.email },
        )
      }

      return savedClient
    })
  }
}
