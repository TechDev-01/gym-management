import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { ReportJob } from '../../src/jobs/queues.js'
import { SubscriptionStatus } from '../../src/modules/memberships/subscription.entity.js'
import type { StatsRepository } from '../../src/modules/stats/stats.repository.js'
import { StatsService } from '../../src/modules/stats/stats.service.js'

function createRepository(): StatsRepository {
  return {
    countActiveClients: async () => 12,
    countSubscriptions: async (status) => status === SubscriptionStatus.ACTIVE ? 8 : 3,
    sumSuccessfulPayments: async () => ({ amount: 12500, currency: 'usd' }),
    countAttendance: async () => 42,
    summarizePayments: async () => [{ status: 'SUCCEEDED', count: 10, amount: 12500 }],
    summarizeCoachUsage: async () => [{
      coachId: 4,
      coachName: 'Alex Coach',
      routinesCreated: 6,
      routineAssignments: 9,
      progressRecords: 11,
    }],
  }
}

test('dashboard aggregates all administrative metrics with explicit period filters', async () => {
  let receivedFrom: Date | undefined
  let receivedTo: Date | undefined
  const repository = createRepository()
  const wrappedRepository: StatsRepository = {
    ...repository,
    sumSuccessfulPayments: async (from, to) => {
      receivedFrom = from
      receivedTo = to
      return repository.sumSuccessfulPayments(from, to)
    },
  }

  const result = await new StatsService(wrappedRepository).dashboard({
    from: '2026-10-01',
    to: '2026-10-27',
  })

  assert.deepEqual(result.period, { from: '2026-10-01', to: '2026-10-27' })
  assert.equal(result.clients.active, 12)
  assert.equal(result.memberships.active, 8)
  assert.equal(result.memberships.expired, 3)
  assert.equal(result.revenue.amount, 12500)
  assert.equal(result.attendance.total, 42)
  assert.equal(result.coachUsage[0]?.routineAssignments, 9)
  assert.equal(receivedFrom?.toISOString(), '2026-10-01T00:00:00.000Z')
  assert.equal(receivedTo?.toISOString(), '2026-10-27T00:00:00.000Z')
})

test('report generation accepts the report type without leaking it into dashboard filters', async () => {
  const job: ReportJob = {
    type: 'admin-report',
    payload: {
      reportType: 'dashboard-summary',
      requestedById: 1,
      filters: {
        from: '2026-10-01',
        to: '2026-10-27',
        timezone: 'UTC',
      },
    },
  }

  const result = await new StatsService(createRepository()).generateReport(job)

  assert.deepEqual(result.period, { from: '2026-10-01', to: '2026-10-27' })
  assert.equal(result.clients.active, 12)
})
