import type { ClientsRepository } from './clients.repository.js'
import { ConflictError } from '../../shared/errors/conflict.error.js'
import { createClientSchema } from './clients.schema.js'
import type { ClientResponse, ClientsHealthResponse } from './types.js'
import { clientsHealthSchema } from './clients.schema.js'

export class ClientsService {
  constructor(private readonly clientsRepository: ClientsRepository) {}

  health(): ClientsHealthResponse {
    return clientsHealthSchema.parse({
      status: 'ok',
      module: this.clientsRepository.getModuleName(),
    })
  }

  async register(input: unknown): Promise<ClientResponse> {
    const clientInput = createClientSchema.parse(input)

    if (await this.clientsRepository.findByEmail(clientInput.email)) {
      throw new ConflictError('Email is already registered')
    }

    if (await this.clientsRepository.findByDni(clientInput.dni)) {
      throw new ConflictError('DNI is already registered')
    }

    const client = await this.clientsRepository.create(clientInput)

    return {
      id: client.id,
      email: client.email ?? clientInput.email,
      dni: client.dni,
      name: client.name,
      lastName: client.lastName,
      phone: client.phone,
      isActive: client.isActive,
      createdAt: client.createdAt,
    }
  }
}
