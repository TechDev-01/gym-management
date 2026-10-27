import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { NotificationService } from '../../src/jobs/services.js'
import type { MembershipsRepository } from '../../src/modules/memberships/memberships.repository.js'
import { SubscriptionStatus, type Subscription } from '../../src/modules/memberships/subscription.entity.js'
import { MembershipExpiryService } from '../../src/jobs/membership-expiry.service.js'

function createSubscription(id: number, clientId: number): Subscription {
  return {
    id,
    clientId,
    membershipId: 1,
    status: SubscriptionStatus.ACTIVE,
    startDate: '2026-10-01',
    endDate: '2026-10-30',
    stripeSubscriptionId: null,
    createdAt: new Date(),
  } as Subscription
}

test('membership expiry scan enqueues one notification per ending subscription', async () => {
  const jobs: Array<{ subscriptionId: number; clientId: number; endDate: string }> = []
  const repository = {
    listActiveSubscriptionsEndingOn: async () => [
      createSubscription(10, 7),
      createSubscription(11, 8),
    ],
  } satisfies Pick<MembershipsRepository, 'listActiveSubscriptionsEndingOn'>
  const notificationService = {
    enqueue: async (job: Extract<Parameters<NotificationService['enqueue']>[0], { type: 'membership-expiring' }>) => {
      jobs.push(job.payload)
    },
  } satisfies Pick<NotificationService, 'enqueue'>

  await new MembershipExpiryService(repository, notificationService, 'UTC').processDailyScan()

  assert.equal(jobs.length, 2)
  assert.equal(jobs[0]?.subscriptionId, 10)
  assert.equal(jobs[1]?.clientId, 8)
  assert.match(jobs[0]?.endDate ?? '', /^\d{4}-\d{2}-\d{2}$/)
})
