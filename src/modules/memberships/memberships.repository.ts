import type { EntityManager, Repository } from 'typeorm'
import { Client } from '../clients/client.entity.js'
import { Membership } from './membership.entity.js'
import { Subscription, SubscriptionStatus } from './subscription.entity.js'
import type {
  CreateMembershipInput,
  CreateSubscriptionInput,
  MembershipFilters,
  SubscriptionFilters,
  UpdateMembershipInput,
} from './types.js'

export interface MembershipsRepository {
  findMembershipById(id: number): Promise<Membership | null>
  findMembershipByName(name: string): Promise<Membership | null>
  listMemberships(filters: MembershipFilters): Promise<Membership[]>
  countMembershipSubscriptions(id: number): Promise<number>
  createMembership(input: CreateMembershipInput): Promise<Membership>
  updateMembership(id: number, input: UpdateMembershipInput): Promise<Membership>
  setMembershipActive(id: number, isActive: boolean): Promise<Membership>
  findClientById(id: number): Promise<Client | null>
  findSubscriptionById(id: number): Promise<Subscription | null>
  listSubscriptions(filters: SubscriptionFilters): Promise<Subscription[]>
  findClientSubscription(clientId: number, status: SubscriptionStatus): Promise<Subscription | null>
  createSubscription(input: CreateSubscriptionInput): Promise<Subscription>
  cancelSubscription(id: number): Promise<Subscription>
  activateSubscription(id: number, startDate: string, endDate: string): Promise<Subscription>
  withTransaction<T>(
    work: (repository: MembershipsRepository, manager: EntityManager) => Promise<T>,
  ): Promise<T>
}

export class TypeOrmMembershipsRepository implements MembershipsRepository {
  constructor(
    private readonly membershipRepository: Repository<Membership>,
    private readonly subscriptionRepository: Repository<Subscription>,
    private readonly clientRepository: Repository<Client>,
  ) {}

  private fromManager(manager: EntityManager): TypeOrmMembershipsRepository {
    return new TypeOrmMembershipsRepository(
      manager.getRepository(Membership),
      manager.getRepository(Subscription),
      manager.getRepository(Client),
    )
  }

  findMembershipById(id: number): Promise<Membership | null> {
    return this.membershipRepository.findOneBy({ id })
  }

  findMembershipByName(name: string): Promise<Membership | null> {
    return this.membershipRepository.findOneBy({ name })
  }

  listMemberships(filters: MembershipFilters): Promise<Membership[]> {
    return this.membershipRepository.find({
      where: filters.includeInactive ? {} : { isActive: true },
      order: { id: 'ASC' },
    })
  }

  countMembershipSubscriptions(id: number): Promise<number> {
    return this.subscriptionRepository.countBy({ membershipId: id })
  }

  async createMembership(input: CreateMembershipInput): Promise<Membership> {
    return this.membershipRepository.save(this.membershipRepository.create({
      ...input,
      isActive: true,
    }))
  }

  async updateMembership(id: number, input: UpdateMembershipInput): Promise<Membership> {
    await this.membershipRepository.update({ id }, input)
    const membership = await this.findMembershipById(id)
    if (!membership) throw new Error('Membership disappeared during update')
    return membership
  }

  async setMembershipActive(id: number, isActive: boolean): Promise<Membership> {
    await this.membershipRepository.update({ id }, { isActive })
    const membership = await this.findMembershipById(id)
    if (!membership) throw new Error('Membership disappeared during update')
    return membership
  }

  findClientById(id: number): Promise<Client | null> {
    return this.clientRepository.findOneBy({ id })
  }

  findSubscriptionById(id: number): Promise<Subscription | null> {
    return this.subscriptionRepository.findOneBy({ id })
  }

  listSubscriptions(filters: SubscriptionFilters): Promise<Subscription[]> {
    return this.subscriptionRepository.find({
      where: filters,
      order: { createdAt: 'DESC' },
    })
  }

  findClientSubscription(clientId: number, status: SubscriptionStatus): Promise<Subscription | null> {
    return this.subscriptionRepository.findOne({
      where: { clientId, status },
      order: { createdAt: 'DESC' },
    })
  }

  async createSubscription(input: CreateSubscriptionInput): Promise<Subscription> {
    return this.subscriptionRepository.save(this.subscriptionRepository.create({
      clientId: input.clientId,
      membershipId: input.membershipId,
      status: SubscriptionStatus.PENDING,
      startDate: null,
      endDate: null,
      stripeSubscriptionId: null,
    }))
  }

  async cancelSubscription(id: number): Promise<Subscription> {
    await this.subscriptionRepository.update({ id }, { status: SubscriptionStatus.CANCELLED })
    const subscription = await this.findSubscriptionById(id)
    if (!subscription) throw new Error('Subscription disappeared during cancellation')
    return subscription
  }

  async activateSubscription(id: number, startDate: string, endDate: string): Promise<Subscription> {
    await this.subscriptionRepository.update(
      { id },
      { status: SubscriptionStatus.ACTIVE, startDate, endDate },
    )
    const subscription = await this.findSubscriptionById(id)
    if (!subscription) throw new Error('Subscription disappeared during activation')
    return subscription
  }

  withTransaction<T>(
    work: (repository: MembershipsRepository, manager: EntityManager) => Promise<T>,
  ): Promise<T> {
    return this.membershipRepository.manager.transaction((manager) => work(this.fromManager(manager), manager))
  }
}
