import { addDays, todayInTimezone } from '../shared/dates.js'
import type { MembershipsRepository } from '../modules/memberships/memberships.repository.js'
import { SubscriptionStatus } from '../modules/memberships/subscription.entity.js'
import { NotificationService } from './services.js'

type MembershipExpiryRepository = Pick<MembershipsRepository, 'listActiveSubscriptionsEndingOn'>
type MembershipExpiryNotifier = Pick<NotificationService, 'enqueue'>

export class MembershipExpiryService {
  constructor(
    private readonly repository: MembershipExpiryRepository,
    private readonly notificationService: MembershipExpiryNotifier,
    private readonly timezone = 'UTC',
  ) {}

  async processDailyScan(): Promise<void> {
    const endDate = addDays(todayInTimezone(this.timezone), 3)
    const subscriptions = await this.repository.listActiveSubscriptionsEndingOn(endDate)

    await Promise.all(subscriptions.map((subscription) => this.notificationService.enqueue(
      {
        type: 'membership-expiring',
        payload: {
          subscriptionId: subscription.id,
          clientId: subscription.clientId,
          endDate,
        },
      },
      `membership-expiry-${subscription.id}-${endDate}`,
    )))
  }
}
