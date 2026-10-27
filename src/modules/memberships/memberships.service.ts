import { ConflictError } from '../../shared/errors/conflict.error.js'
import { ForbiddenError } from '../../shared/errors/forbidden.error.js'
import { NotFoundError } from '../../shared/errors/not-found.error.js'
import { SubscriptionStatus } from './subscription.entity.js'
import {
  createMembershipSchema,
  createSubscriptionSchema,
  membershipStatusSchema,
  updateMembershipSchema,
} from './memberships.schema.js'
import type { MembershipsRepository } from './memberships.repository.js'
import type {
  MembershipResponse,
  PaymentGateway,
  SubscriptionResponse,
  UpdateMembershipInput,
} from './types.js'
import { toMembershipResponse, toSubscriptionResponse } from './types.js'

export class MembershipsService {
  constructor(
    private readonly repository: MembershipsRepository,
    private readonly paymentGateway?: PaymentGateway,
    private readonly timezone = 'UTC',
  ) {}

  async listMemberships(includeInactive = false): Promise<MembershipResponse[]> {
    const memberships = await this.repository.listMemberships({ includeInactive })
    return memberships.map(toMembershipResponse)
  }

  async getMembership(id: number): Promise<MembershipResponse> {
    const membership = await this.repository.findMembershipById(id)
    if (!membership) throw new NotFoundError('Membership not found')
    return toMembershipResponse(membership)
  }

  async createMembership(input: unknown): Promise<MembershipResponse> {
    const data = createMembershipSchema.parse(input)
    if (await this.repository.findMembershipByName(data.name)) {
      throw new ConflictError('Membership name is already registered')
    }
    return toMembershipResponse(await this.repository.createMembership({
      ...data,
      description: data.description ?? null,
      maxDaysPerWeek: data.maxDaysPerWeek ?? null,
      stripePriceId: data.stripePriceId ?? null,
    }))
  }

  async updateMembership(id: number, input: unknown): Promise<MembershipResponse> {
    const data = updateMembershipSchema.parse(input)
    const membership = await this.requireMembership(id)
    if (data.name && data.name !== membership.name && await this.repository.findMembershipByName(data.name)) {
      throw new ConflictError('Membership name is already registered')
    }

    const hasHistoricalSubscriptions = await this.repository.countMembershipSubscriptions(id) > 0
    const protectedFields: (keyof UpdateMembershipInput)[] = ['priceAmount', 'durationDays', 'maxDaysPerWeek']
    if (hasHistoricalSubscriptions && protectedFields.some((field) => data[field] !== undefined)) {
      throw new ConflictError('Pricing and duration cannot change after a subscription exists')
    }

    return toMembershipResponse(await this.repository.updateMembership(id, data))
  }

  async setMembershipStatus(id: number, input: unknown, role: string): Promise<MembershipResponse> {
    if (role !== 'ADMIN') throw new ForbiddenError('Only ADMIN can change membership status')
    const { isActive } = membershipStatusSchema.parse(input)
    await this.requireMembership(id)
    return toMembershipResponse(await this.repository.setMembershipActive(id, isActive))
  }

  async createSubscription(input: unknown, user: { role: string; clientId: number | null }): Promise<SubscriptionResponse & { checkoutUrl: string | null }> {
    const data = createSubscriptionSchema.parse(input)
    if (user.role === 'CLIENT' && user.clientId !== data.clientId) {
      throw new ForbiddenError('Clients can only create their own subscriptions')
    }

    const purchase = await this.repository.withTransaction(async (repository, manager) => {
      const client = await repository.findClientById(data.clientId)
      if (!client || !client.isActive) {
        throw new NotFoundError('Active client not found')
      }
      const membership = await repository.findMembershipById(data.membershipId)
      if (!membership || !membership.isActive) throw new ConflictError('Membership is not active')
      if (await repository.findClientSubscription(data.clientId, SubscriptionStatus.ACTIVE)) {
        throw new ConflictError('Client already has an active subscription')
      }

      const pending = await repository.findClientSubscription(data.clientId, SubscriptionStatus.PENDING)
      if (pending) {
        await repository.cancelSubscription(pending.id)
      }

      const subscription = await repository.createSubscription({
        clientId: data.clientId,
        membershipId: membership.id,
        method: data.method,
      })

      const payment = this.paymentGateway
        ? await this.paymentGateway.createPendingPayment(manager, {
            subscriptionId: subscription.id,
            clientId: client.id,
            amount: membership.priceAmount,
            currency: membership.currency,
            method: data.method,
          })
        : null

      return {
        subscription,
        clientEmail: client.email,
        membershipName: membership.name,
        membershipPriceId: membership.stripePriceId,
        membershipAmount: membership.priceAmount,
        membershipCurrency: membership.currency,
        paymentId: payment?.paymentId ?? null,
        previousPendingId: pending?.id ?? null,
      }
    })

    if (purchase.previousPendingId && this.paymentGateway) {
      await this.paymentGateway.expirePendingCheckout(purchase.previousPendingId)
    }

    let checkoutUrl: string | null = null
    if (this.paymentGateway && purchase.paymentId && data.method === 'CARD') {
      try {
        const checkout = await this.paymentGateway.createCheckoutSession({
          subscriptionId: purchase.subscription.id,
          paymentId: purchase.paymentId,
          membershipName: purchase.membershipName,
          membershipPriceId: purchase.membershipPriceId,
          amount: purchase.membershipAmount,
          currency: purchase.membershipCurrency,
          clientEmail: purchase.clientEmail,
        })
        await this.paymentGateway.attachCheckoutSession(purchase.paymentId, checkout.sessionId)
        checkoutUrl = checkout.checkoutUrl
      } catch (error: unknown) {
        await this.paymentGateway.markPaymentFailed(purchase.paymentId)
        throw error
      }
    }

    return {
      ...toSubscriptionResponse(purchase.subscription),
      checkoutUrl,
    }
  }

  async listSubscriptions(filters: { clientId?: number; status?: SubscriptionStatus }, user: { role: string; clientId: number | null }): Promise<SubscriptionResponse[]> {
    const clientId = user.role === 'CLIENT' ? user.clientId ?? -1 : filters.clientId
    return (await this.repository.listSubscriptions({ ...filters, clientId })).map(toSubscriptionResponse)
  }

  async getSubscription(id: number, user: { role: string; clientId: number | null }): Promise<SubscriptionResponse> {
    const subscription = await this.requireSubscription(id)
    this.assertSubscriptionAccess(subscription.clientId, user)
    return toSubscriptionResponse(subscription)
  }

  async cancelSubscription(id: number, user: { role: string; clientId: number | null }): Promise<SubscriptionResponse> {
    const subscription = await this.requireSubscription(id)
    if (!['ADMIN', 'RECEPTION'].includes(user.role)) throw new ForbiddenError('Only staff can cancel subscriptions')
    if (subscription.status === SubscriptionStatus.CANCELLED) return toSubscriptionResponse(subscription)
    if (subscription.status === SubscriptionStatus.ACTIVE || subscription.status === SubscriptionStatus.PENDING) {
      if (subscription.status === SubscriptionStatus.PENDING && this.paymentGateway) {
        await this.paymentGateway.expirePendingCheckout(id)
      }
      return toSubscriptionResponse(await this.repository.cancelSubscription(id))
    }
    throw new ConflictError('Expired subscriptions cannot be cancelled')
  }

  async confirmManualPayment(id: number, user: { role: string; id: string }): Promise<SubscriptionResponse> {
    if (!['ADMIN', 'RECEPTION'].includes(user.role)) throw new ForbiddenError('Only staff can confirm payments')
    const subscription = await this.requireSubscription(id)
    if (subscription.status !== SubscriptionStatus.PENDING) throw new ConflictError('Only pending subscriptions can be confirmed')
    const membership = await this.requireMembership(subscription.membershipId)
    const startDate = this.todayInTimezone()
    const endDate = addDays(startDate, membership.durationDays - 1)
    if (this.paymentGateway) await this.paymentGateway.confirmManualPayment(id, Number(user.id))
    return toSubscriptionResponse(await this.repository.activateSubscription(id, startDate, endDate))
  }

  private async requireMembership(id: number) {
    const membership = await this.repository.findMembershipById(id)
    if (!membership) throw new NotFoundError('Membership not found')
    return membership
  }

  private async requireSubscription(id: number) {
    const subscription = await this.repository.findSubscriptionById(id)
    if (!subscription) throw new NotFoundError('Subscription not found')
    return subscription
  }

  private assertSubscriptionAccess(clientId: number, user: { role: string; clientId: number | null }): void {
    if (user.role === 'CLIENT' && user.clientId !== clientId) throw new ForbiddenError()
  }

  private todayInTimezone(): string {
    try {
      return new Intl.DateTimeFormat('en-CA', {
        timeZone: this.timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(new Date())
    } catch {
      throw new ConflictError('GYM_TIMEZONE is invalid')
    }
  }
}

function addDays(date: string, days: number): string {
  const value = new Date(`${date}T00:00:00Z`)
  value.setUTCDate(value.getUTCDate() + days)
  return value.toISOString().slice(0, 10)
}
