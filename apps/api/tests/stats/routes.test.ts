import assert from 'node:assert/strict'
import express from 'express'
import jwt from 'jsonwebtoken'
import { test } from 'node:test'
import type {
  ReportJobStatus,
  ReportQueuePort,
  ReportStatusSnapshot,
} from '../../src/jobs/services.js'
import type { ReportJob } from '../../src/jobs/queues.js'
import type { StatsRepository } from '../../src/modules/stats/stats.repository.js'
import { createStatsRouter } from '../../src/modules/stats/stats.routes.js'
import { StatsService } from '../../src/modules/stats/stats.service.js'
import { errorHandlerMiddleware } from '../../src/shared/middlewares/error-handler.middleware.js'

const secret = 'test-secret-with-at-least-32-characters'

interface TestUser {
  id: string
  role: 'ADMIN' | 'RECEPTION' | 'CLIENT'
}

function createRepository(): StatsRepository {
  return {
    countActiveClients: async () => 12,
    countSubscriptions: async () => 8,
    sumSuccessfulPayments: async () => ({ amount: 12500, currency: 'usd' }),
    countAttendance: async () => 42,
    summarizePayments: async () => [{ status: 'SUCCEEDED', count: 10, amount: 12500 }],
    summarizeCoachUsage: async () => [],
  }
}

function createReport(
  overrides: Partial<ReportStatusSnapshot> = {},
): ReportStatusSnapshot {
  return {
    jobId: 'admin-report-1-1760000000000',
    reportType: 'dashboard-summary',
    status: 'pending',
    requestedById: 1,
    requestedAt: '2026-10-28T12:00:00.000Z',
    finishedAt: null,
    result: null,
    error: null,
    ...overrides,
  }
}

function createReportQueue(
  reports: Record<string, ReportStatusSnapshot | null> = {},
): ReportQueuePort & { enqueued: ReportJob[] } {
  const enqueued: ReportJob[] = []

  return {
    enqueued,
    enqueue: async (job) => {
      enqueued.push(job)
      return { id: 'admin-report-1-1760000000000' }
    },
    getStatus: async (jobId) => reports[jobId] ?? null,
  }
}

async function request(
  user: TestUser,
  path: string,
  reportQueue: ReportQueuePort,
  init: RequestInit = {},
): Promise<Response> {
  const previousSecret = process.env.JWT_SECRET
  process.env.JWT_SECRET = secret
  const app = express()
  app.use(express.json())
  app.use(
    '/stats',
    createStatsRouter(new StatsService(createRepository()), reportQueue),
  )
  app.use(errorHandlerMiddleware)
  const server = app.listen(0)
  const address = server.address()
  assert(address && typeof address === 'object')

  const token = jwt.sign(
    { sub: user.id, role: user.role, clientId: null, coachId: null },
    secret,
  )

  try {
    return await fetch(`http://127.0.0.1:${address.port}${path}`, {
      ...init,
      headers: {
        authorization: `Bearer ${token}`,
        ...(init.body ? { 'content-type': 'application/json' } : {}),
      },
    })
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()))
    })
    if (previousSecret === undefined) {
      delete process.env.JWT_SECRET
    } else {
      process.env.JWT_SECRET = previousSecret
    }
  }
}

test('an admin can read the status of a completed report', async () => {
  const status: ReportJobStatus = 'completed'
  const reportQueue = createReportQueue({
    'admin-report-1-1760000000000': createReport({
      status,
      finishedAt: '2026-10-28T12:00:05.000Z',
      result: { clients: { active: 12 } },
    }),
  })

  const response = await request(
    { id: '1', role: 'ADMIN' },
    '/stats/reports/admin-report-1-1760000000000',
    reportQueue,
  )

  assert.equal(response.status, 200)
  const body = await response.json() as {
    jobId: string
    status: string
    result: unknown
  }
  assert.equal(body.jobId, 'admin-report-1-1760000000000')
  assert.equal(body.status, 'completed')
  assert.deepEqual(body.result, { clients: { active: 12 } })
})

test('reception can read a pending report', async () => {
  const reportQueue = createReportQueue({
    'admin-report-2-1760000000000': createReport({
      jobId: 'admin-report-2-1760000000000',
      requestedById: 2,
    }),
  })

  const response = await request(
    { id: '2', role: 'RECEPTION' },
    '/stats/reports/admin-report-2-1760000000000',
    reportQueue,
  )

  assert.equal(response.status, 200)
  const body = await response.json() as { status: string }
  assert.equal(body.status, 'pending')
})

test('a failed report exposes the failure reason', async () => {
  const reportQueue = createReportQueue({
    'admin-report-1-1760000000000': createReport({
      status: 'failed',
      finishedAt: '2026-10-28T12:00:05.000Z',
      error: 'Database unavailable',
    }),
  })

  const response = await request(
    { id: '1', role: 'ADMIN' },
    '/stats/reports/admin-report-1-1760000000000',
    reportQueue,
  )

  assert.equal(response.status, 200)
  const body = await response.json() as { status: string; error: string }
  assert.equal(body.status, 'failed')
  assert.equal(body.error, 'Database unavailable')
})

test('unknown reports and reports owned by another user return not found', async () => {
  const reportQueue = createReportQueue({
    'admin-report-1-1760000000000': createReport({ requestedById: 1 }),
  })

  const unknown = await request(
    { id: '1', role: 'ADMIN' },
    '/stats/reports/missing',
    reportQueue,
  )
  const foreign = await request(
    { id: '2', role: 'RECEPTION' },
    '/stats/reports/admin-report-1-1760000000000',
    reportQueue,
  )

  assert.equal(unknown.status, 404)
  assert.equal(foreign.status, 404)
})

test('clients cannot read administrative reports', async () => {
  const reportQueue = createReportQueue({
    'admin-report-1-1760000000000': createReport(),
  })

  const response = await request(
    { id: '1', role: 'CLIENT' },
    '/stats/reports/admin-report-1-1760000000000',
    reportQueue,
  )

  assert.equal(response.status, 403)
})

test('requesting a report forwards filters and the requester id', async () => {
  const reportQueue = createReportQueue()

  const response = await request(
    { id: '1', role: 'ADMIN' },
    '/stats/reports',
    reportQueue,
    {
      method: 'POST',
      body: JSON.stringify({
        reportType: 'dashboard-summary',
        from: '2026-10-01',
        to: '2026-10-28',
      }),
    },
  )

  assert.equal(response.status, 202)
  assert.equal(reportQueue.enqueued.length, 1)
  assert.deepEqual(reportQueue.enqueued[0]?.payload.filters, {
    from: '2026-10-01',
    to: '2026-10-28',
  })
  assert.equal(reportQueue.enqueued[0]?.payload.requestedById, 1)
})
