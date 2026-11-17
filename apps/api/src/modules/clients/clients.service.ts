import bcrypt from 'bcrypt'
import type { ClientsRepository } from './clients.repository.js'
import { ConflictError } from '../../shared/errors/conflict.error.js'
import { NotFoundError } from '../../shared/errors/not-found.error.js'
import type { Page } from '../../shared/pagination.js'
import { toPage } from '../../shared/pagination.js'
import {
  clientIdSchema,
  clientsHealthSchema,
  clientsQuerySchema,
  createClientSchema,
  updateClientSchema,
} from './clients.schema.js'
import type {
  ClientResponse,
  ClientsHealthResponse,
} from './types.js'

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

    if (
      await this.clientsRepository.findByEmail(clientInput.email)
      || await this.clientsRepository.findAppUserByEmail(clientInput.email)
    ) {
      throw new ConflictError('Email is already registered')
    }

    if (await this.clientsRepository.findByDni(clientInput.dni)) {
      throw new ConflictError('DNI is already registered')
    }

    const { password, ...clientData } = clientInput
    const client = password && this.clientsRepository.createWithCredentials
      ? await this.clientsRepository.createWithCredentials(
          clientData,
          await bcrypt.hash(password, 12),
        )
      : await this.clientsRepository.create(clientData)

    return this.toClientResponse(client)
  }

  async getClients(input: unknown = {}): Promise<Page<ClientResponse>> {
    const query = clientsQuerySchema.parse(input)
    const result = await this.clientsRepository.getClients(query)
    return toPage(result.items.map((client) => this.toClientResponse(client)), result.total, query)
  }

  async getClient(inputId: unknown): Promise<ClientResponse> {
    const id = clientIdSchema.parse(inputId)
    const client = await this.clientsRepository.getClient(id)

    if (!client) {
      throw new NotFoundError('Client not found')
    }

    return this.toClientResponse(client)
  }

  async updateClient(inputId: unknown, input: unknown): Promise<ClientResponse> {
    const id = clientIdSchema.parse(inputId)
    const clientInput = updateClientSchema.parse(input)
    const existingClient = await this.clientsRepository.getClient(id)

    if (!existingClient) {
      throw new NotFoundError('Client not found')
    }

    if (
      clientInput.email &&
      clientInput.email !== existingClient.email &&
      (
        await this.clientsRepository.findByEmail(clientInput.email)
        || await this.clientsRepository.findAppUserByEmail(clientInput.email)
      )
    ) {
      throw new ConflictError('Email is already registered')
    }

    if (
      clientInput.dni &&
      clientInput.dni !== existingClient.dni &&
      (await this.clientsRepository.findByDni(clientInput.dni))
    ) {
      throw new ConflictError('DNI is already registered')
    }

    const client = await this.clientsRepository.updateClient(id, clientInput)

    if (!client) {
      throw new NotFoundError('Client not found')
    }

    return this.toClientResponse(client)
  }

  private toClientResponse(client: {
    id: number
    email: string | null
    dni: string
    name: string
    lastName: string
    phone: string
    isActive: boolean
    createdAt: Date
  }): ClientResponse {
    return {
      id: client.id,
      email: client.email ?? '',
      dni: client.dni,
      name: client.name,
      lastName: client.lastName,
      phone: client.phone,
      isActive: client.isActive,
      createdAt: client.createdAt,
    }
  }
}
