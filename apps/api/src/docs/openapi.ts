const idParameter = {
  name: 'id',
  in: 'path',
  required: true,
  schema: { type: 'integer', minimum: 1 },
}

const queryParameter = (name: string, schema: Record<string, unknown>) => ({
  name,
  in: 'query' as const,
  required: false,
  schema,
})

const jsonBody = (schema: string) => ({
  required: true,
  content: {
    'application/json': {
      schema: { $ref: `#/components/schemas/${schema}` },
    },
  },
})

const secured = (roles?: string[]) => ({
  security: [{ bearerAuth: [] }],
  ...(roles ? { description: `Requires one of these roles: ${roles.join(', ')}` } : {}),
})

const success = (schema: string, status = '200') => ({
  [status]: {
    description: 'Successful response',
    content: {
      'application/json': {
        schema: { $ref: `#/components/schemas/${schema}` },
      },
    },
  },
})

export const openapiDocument = {
  openapi: '3.0.3',
  info: {
    title: 'Gym Management API',
    version: '1.0.0',
    description: 'Versioned API for gym management, memberships, payments and reporting.',
  },
  servers: [{ url: '/api/v1' }],
  tags: [
    { name: 'Health' },
    { name: 'Auth' },
    { name: 'Clients' },
    { name: 'Coaches' },
    { name: 'Memberships' },
    { name: 'Subscriptions' },
    { name: 'Attendance' },
    { name: 'Routines' },
    { name: 'Progress' },
    { name: 'Stats' },
    { name: 'Payments' },
  ],
  paths: {
    '/health': {
      get: { tags: ['Health'], summary: 'Check API health', responses: success('HealthResponse') },
    },
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Authenticate a user',
        requestBody: jsonBody('LoginRequest'),
        responses: {
          ...success('AuthResponse'),
          '400': { $ref: '#/components/responses/BadRequest' },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Register an administrative user',
        ...secured(['ADMIN']),
        requestBody: jsonBody('RegisterRequest'),
        responses: {
          ...success('AuthResponse', '201'),
          '400': { $ref: '#/components/responses/BadRequest' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
        },
      },
    },
    '/clients/health': {
      get: { tags: ['Clients'], summary: 'Check clients module health', responses: success('ModuleHealthResponse') },
    },
    '/clients': {
      get: {
        tags: ['Clients'],
        summary: 'List clients',
        responses: success('ClientListResponse'),
      },
      post: {
        tags: ['Clients'],
        summary: 'Create a client',
        requestBody: jsonBody('CreateClientRequest'),
        responses: { ...success('ClientResponse', '201'), '400': { $ref: '#/components/responses/BadRequest' } },
      },
    },
    '/clients/{id}': {
      parameters: [idParameter],
      get: { tags: ['Clients'], summary: 'Get a client', responses: success('ClientResponse') },
      patch: {
        tags: ['Clients'],
        summary: 'Update a client',
        requestBody: jsonBody('UpdateClientRequest'),
        responses: {
          ...success('ClientResponse'),
          '400': { $ref: '#/components/responses/BadRequest' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/coaches/health': {
      get: { tags: ['Coaches'], summary: 'Check coaches module health', responses: success('ModuleHealthResponse') },
    },
    '/coaches': {
      get: { tags: ['Coaches'], summary: 'List coaches', responses: success('CoachListResponse') },
      post: {
        tags: ['Coaches'],
        summary: 'Create a coach',
        requestBody: jsonBody('CreateCoachRequest'),
        responses: success('CoachResponse', '201'),
      },
    },
    '/coaches/{id}': {
      parameters: [idParameter],
      get: { tags: ['Coaches'], summary: 'Get a coach', responses: success('CoachResponse') },
      patch: {
        tags: ['Coaches'],
        summary: 'Update a coach',
        requestBody: jsonBody('UpdateCoachRequest'),
        responses: success('CoachResponse'),
      },
    },
    '/coaches/{coachId}/schedules': {
      parameters: [
        {
          name: 'coachId',
          in: 'path',
          required: true,
          schema: { type: 'integer', minimum: 1 },
        },
      ],
      get: {
        tags: ['Coaches'],
        summary: 'List the weekly schedule of a coach',
        ...secured(['ADMIN', 'RECEPTION', 'COACH']),
        responses: {
          ...success('CoachScheduleListResponse'),
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
      post: {
        tags: ['Coaches'],
        summary: 'Add a weekly schedule slot for a coach',
        ...secured(['ADMIN', 'RECEPTION']),
        requestBody: jsonBody('CreateCoachScheduleRequest'),
        responses: {
          ...success('CoachScheduleResponse', '201'),
          '400': { $ref: '#/components/responses/BadRequest' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
          '409': { $ref: '#/components/responses/Conflict' },
        },
      },
    },
    '/coaches/{coachId}/schedules/{scheduleId}': {
      parameters: [
        {
          name: 'coachId',
          in: 'path',
          required: true,
          schema: { type: 'integer', minimum: 1 },
        },
        {
          name: 'scheduleId',
          in: 'path',
          required: true,
          schema: { type: 'integer', minimum: 1 },
        },
      ],
      patch: {
        tags: ['Coaches'],
        summary: 'Update a coach schedule slot',
        ...secured(['ADMIN', 'RECEPTION']),
        requestBody: jsonBody('UpdateCoachScheduleRequest'),
        responses: {
          ...success('CoachScheduleResponse'),
          '400': { $ref: '#/components/responses/BadRequest' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
          '409': { $ref: '#/components/responses/Conflict' },
        },
      },
      delete: {
        tags: ['Coaches'],
        summary: 'Delete a coach schedule slot',
        ...secured(['ADMIN', 'RECEPTION']),
        responses: {
          '204': { description: 'Schedule slot deleted' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/memberships': {
      get: { tags: ['Memberships'], summary: 'List memberships', ...secured(['ADMIN', 'RECEPTION', 'CLIENT']), parameters: [queryParameter('includeInactive', { type: 'boolean', default: false })], responses: success('MembershipListResponse') },
      post: { tags: ['Memberships'], summary: 'Create a membership', ...secured(['ADMIN', 'RECEPTION']), requestBody: jsonBody('CreateMembershipRequest'), responses: success('MembershipResponse', '201') },
    },
    '/memberships/{id}': {
      parameters: [idParameter],
      get: { tags: ['Memberships'], summary: 'Get a membership', ...secured(['ADMIN', 'RECEPTION', 'CLIENT']), responses: success('MembershipResponse') },
      patch: { tags: ['Memberships'], summary: 'Update a membership', ...secured(['ADMIN', 'RECEPTION']), requestBody: jsonBody('UpdateMembershipRequest'), responses: success('MembershipResponse') },
    },
    '/memberships/{id}/status': {
      parameters: [idParameter],
      patch: { tags: ['Memberships'], summary: 'Change membership status', ...secured(['ADMIN']), requestBody: jsonBody('MembershipStatusRequest'), responses: success('MembershipResponse') },
    },
    '/memberships/{id}/subscriptions': {
      parameters: [idParameter],
      post: { tags: ['Memberships'], summary: 'Create a subscription', ...secured(['ADMIN', 'RECEPTION', 'CLIENT']), requestBody: jsonBody('CreateSubscriptionRequest'), responses: success('SubscriptionWithCheckoutResponse', '201') },
    },
    '/subscriptions': {
      get: { tags: ['Subscriptions'], summary: 'List subscriptions', ...secured(['ADMIN', 'RECEPTION', 'CLIENT']), parameters: [queryParameter('clientId', { type: 'integer', minimum: 1 }), queryParameter('status', { $ref: '#/components/schemas/SubscriptionStatus' })], responses: success('SubscriptionListResponse') },
    },
    '/subscriptions/{id}': {
      parameters: [idParameter],
      get: { tags: ['Subscriptions'], summary: 'Get a subscription', ...secured(['ADMIN', 'RECEPTION', 'CLIENT']), responses: success('SubscriptionResponse') },
    },
    '/subscriptions/{id}/cancel': {
      parameters: [idParameter],
      post: { tags: ['Subscriptions'], summary: 'Cancel a subscription', ...secured(['ADMIN', 'RECEPTION']), responses: success('SubscriptionResponse') },
    },
    '/subscriptions/{id}/payment-confirmation': {
      parameters: [idParameter],
      post: { tags: ['Subscriptions'], summary: 'Confirm a manual payment', ...secured(['ADMIN', 'RECEPTION']), responses: success('SubscriptionResponse') },
    },
    '/attendance': {
      get: { tags: ['Attendance'], summary: 'List attendance records', ...secured(['ADMIN', 'RECEPTION', 'CLIENT']), parameters: [queryParameter('clientId', { type: 'integer', minimum: 1 }), queryParameter('from', { type: 'string', format: 'date' }), queryParameter('to', { type: 'string', format: 'date' }), queryParameter('open', { type: 'boolean' }), queryParameter('page', { type: 'integer', minimum: 1, default: 1 }), queryParameter('limit', { type: 'integer', minimum: 1, maximum: 100, default: 20 })], responses: success('AttendancePageResponse') },
    },
    '/attendance/check-in': {
      post: { tags: ['Attendance'], summary: 'Check in a client', ...secured(['ADMIN', 'RECEPTION', 'CLIENT']), requestBody: jsonBody('CheckInRequest'), responses: success('AttendanceResponse', '201') },
    },
    '/attendance/{id}/check-out': {
      parameters: [idParameter],
      post: { tags: ['Attendance'], summary: 'Check out a client', ...secured(['ADMIN', 'RECEPTION', 'CLIENT']), responses: success('AttendanceResponse') },
    },
    '/routines': {
      get: { tags: ['Routines'], summary: 'List routines', ...secured(), parameters: [queryParameter('includeInactive', { type: 'boolean', default: false })], responses: success('RoutineListResponse') },
      post: { tags: ['Routines'], summary: 'Create a routine', ...secured(['ADMIN', 'COACH']), requestBody: jsonBody('CreateRoutineRequest'), responses: success('RoutineResponse', '201') },
    },
    '/routines/{id}': {
      parameters: [idParameter],
      get: { tags: ['Routines'], summary: 'Get a routine', ...secured(), responses: success('RoutineResponse') },
      patch: { tags: ['Routines'], summary: 'Update a routine', ...secured(['ADMIN', 'COACH']), requestBody: jsonBody('UpdateRoutineRequest'), responses: success('RoutineResponse') },
    },
    '/routines/exercises': {
      get: { tags: ['Routines'], summary: 'List exercises', ...secured(), responses: success('ExerciseListResponse') },
      post: { tags: ['Routines'], summary: 'Create an exercise', ...secured(['ADMIN', 'COACH']), requestBody: jsonBody('CreateExerciseRequest'), responses: success('ExerciseResponse', '201') },
    },
    '/routines/exercises/{id}': {
      parameters: [idParameter],
      get: { tags: ['Routines'], summary: 'Get an exercise', ...secured(), responses: success('ExerciseResponse') },
      patch: { tags: ['Routines'], summary: 'Update an exercise', ...secured(['ADMIN', 'COACH']), requestBody: jsonBody('UpdateExerciseRequest'), responses: success('ExerciseResponse') },
    },
    '/routines/assignments': {
      get: { tags: ['Routines'], summary: 'List routine assignments', ...secured(), parameters: [queryParameter('clientId', { type: 'integer', minimum: 1 }), queryParameter('status', { type: 'string', enum: ['ACTIVE', 'COMPLETED', 'CANCELLED'] })], responses: success('AssignmentListResponse') },
      post: { tags: ['Routines'], summary: 'Assign a routine', ...secured(['ADMIN', 'COACH']), requestBody: jsonBody('CreateAssignmentRequest'), responses: success('AssignmentResponse', '201') },
    },
    '/routines/assignments/{id}': {
      parameters: [idParameter],
      get: { tags: ['Routines'], summary: 'Get a routine assignment', ...secured(), responses: success('AssignmentResponse') },
    },
    '/routines/assignments/{id}/status': {
      parameters: [idParameter],
      post: { tags: ['Routines'], summary: 'Update assignment status', ...secured(['ADMIN', 'COACH']), requestBody: jsonBody('AssignmentStatusRequest'), responses: success('AssignmentResponse') },
    },
    '/routines/{id}/status': {
      parameters: [idParameter],
      patch: { tags: ['Routines'], summary: 'Change routine status', ...secured(['ADMIN', 'COACH']), requestBody: jsonBody('RoutineStatusRequest'), responses: success('RoutineResponse') },
    },
    '/routines/{id}/exercises': {
      parameters: [idParameter],
      post: { tags: ['Routines'], summary: 'Add an exercise to a routine', ...secured(['ADMIN', 'COACH']), requestBody: jsonBody('CreateRoutineExerciseRequest'), responses: success('RoutineExerciseResponse', '201') },
    },
    '/routines/{id}/exercises/{routineExerciseId}': {
      parameters: [idParameter, { name: 'routineExerciseId', in: 'path', required: true, schema: { type: 'integer', minimum: 1 } }],
      patch: { tags: ['Routines'], summary: 'Update a routine exercise', ...secured(['ADMIN', 'COACH']), requestBody: jsonBody('UpdateRoutineExerciseRequest'), responses: success('RoutineExerciseResponse') },
      delete: { tags: ['Routines'], summary: 'Remove an exercise from a routine', ...secured(['ADMIN', 'COACH']), responses: { '204': { description: 'Exercise removed' } } },
    },
    '/progress': {
      get: { tags: ['Progress'], summary: 'List progress records', ...secured(), parameters: [queryParameter('clientId', { type: 'integer', minimum: 1 }), queryParameter('from', { type: 'string', format: 'date' }), queryParameter('to', { type: 'string', format: 'date' }), queryParameter('page', { type: 'integer', minimum: 1, default: 1 }), queryParameter('limit', { type: 'integer', minimum: 1, maximum: 100, default: 20 })], responses: success('ProgressPageResponse') },
      post: { tags: ['Progress'], summary: 'Create a progress record', ...secured(['ADMIN', 'COACH', 'CLIENT']), requestBody: jsonBody('CreateProgressRequest'), responses: success('ProgressResponse', '201') },
    },
    '/progress/{id}': {
      parameters: [idParameter],
      get: { tags: ['Progress'], summary: 'Get a progress record', ...secured(), responses: success('ProgressResponse') },
    },
    '/stats/dashboard': {
      get: { tags: ['Stats'], summary: 'Get administrative dashboard statistics', ...secured(['ADMIN', 'RECEPTION']), parameters: [queryParameter('from', { type: 'string', format: 'date' }), queryParameter('to', { type: 'string', format: 'date' }), queryParameter('timezone', { type: 'string' })], responses: success('DashboardStatsResponse') },
    },
    '/stats/reports': {
      post: { tags: ['Stats'], summary: 'Request an administrative report', ...secured(['ADMIN', 'RECEPTION']), requestBody: jsonBody('ReportRequest'), responses: success('ReportRequestResponse', '202') },
    },
    '/stats/reports/{jobId}': {
      parameters: [
        {
          name: 'jobId',
          in: 'path',
          required: true,
          schema: { type: 'string', minLength: 1, maxLength: 200 },
        },
      ],
      get: {
        tags: ['Stats'],
        summary: 'Get the status of an administrative report',
        ...secured(['ADMIN', 'RECEPTION']),
        responses: {
          ...success('ReportStatusResponse'),
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/payments': {
      get: { tags: ['Payments'], summary: 'List payments', ...secured(['ADMIN', 'RECEPTION']), parameters: [queryParameter('clientId', { type: 'integer', minimum: 1 }), queryParameter('subscriptionId', { type: 'integer', minimum: 1 }), queryParameter('method', { $ref: '#/components/schemas/PaymentMethod' }), queryParameter('status', { type: 'string', enum: ['PENDING', 'SUCCEEDED', 'FAILED', 'REFUNDED'] })], responses: success('PaymentListResponse') },
    },
    '/payments/{id}': {
      parameters: [idParameter],
      get: { tags: ['Payments'], summary: 'Get a payment', ...secured(['ADMIN', 'RECEPTION']), responses: success('PaymentResponse') },
    },
    '/payments/webhook': {
      post: {
        tags: ['Payments'],
        summary: 'Receive Stripe webhook events',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', additionalProperties: true } } },
        },
        responses: { '200': { description: 'Webhook accepted' }, '400': { $ref: '#/components/responses/BadRequest' } },
      },
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
    schemas: {
      AuthenticatedUser: {
        type: 'object',
        required: ['id', 'email', 'role', 'clientId', 'coachId'],
        properties: {
          id: { type: 'string' },
          email: { type: 'string', format: 'email' },
          role: { type: 'string', enum: ['ADMIN', 'RECEPTION', 'COACH', 'CLIENT'] },
          clientId: { type: 'integer', nullable: true },
          coachId: { type: 'integer', nullable: true },
        },
      },
      ReportStatusResponse: {
        type: 'object',
        required: ['jobId', 'reportType', 'status'],
        properties: {
          jobId: { type: 'string' },
          reportType: { type: 'string', example: 'dashboard-summary' },
          status: { type: 'string', enum: ['pending', 'completed', 'failed'] },
          requestedAt: { type: 'string', format: 'date-time', nullable: true },
          finishedAt: { type: 'string', format: 'date-time', nullable: true },
          result: { $ref: '#/components/schemas/DashboardStatsResponse', nullable: true },
          error: { type: 'string', nullable: true },
        },
      },
      HealthResponse: { type: 'object', required: ['status'], properties: { status: { type: 'string', example: 'ok' } } },
      ModuleHealthResponse: { type: 'object', required: ['status', 'module'], properties: { status: { type: 'string', example: 'ok' }, module: { type: 'string' } } },
      LoginRequest: { type: 'object', required: ['email', 'password'], properties: { email: { type: 'string', format: 'email' }, password: { type: 'string', minLength: 1 } } },
      RegisterRequest: { type: 'object', required: ['email', 'password', 'role'], properties: { email: { type: 'string', format: 'email' }, password: { type: 'string', minLength: 8 }, role: { type: 'string', enum: ['ADMIN', 'RECEPTION'] } } },
      AuthResponse: {
        type: 'object',
        required: ['accessToken', 'user'],
        properties: {
          accessToken: { type: 'string' },
          user: { $ref: '#/components/schemas/AuthenticatedUser' },
        },
      },
      CreateClientRequest: { type: 'object', required: ['email', 'dni', 'name', 'lastName', 'phone'], properties: { email: { type: 'string', format: 'email' }, password: { type: 'string', minLength: 8 }, dni: { type: 'string' }, name: { type: 'string' }, lastName: { type: 'string' }, phone: { type: 'string' } } },
      UpdateClientRequest: { type: 'object', minProperties: 1, properties: { email: { type: 'string', format: 'email' }, dni: { type: 'string' }, name: { type: 'string' }, lastName: { type: 'string' }, phone: { type: 'string' } } },
      ClientResponse: {
        type: 'object',
        required: ['id', 'email', 'dni', 'name', 'lastName', 'phone', 'isActive', 'createdAt'],
        properties: {
          id: { type: 'integer' }, email: { type: 'string', format: 'email' }, dni: { type: 'string' },
          name: { type: 'string' }, lastName: { type: 'string' }, phone: { type: 'string' },
          isActive: { type: 'boolean' }, createdAt: { type: 'string', format: 'date-time' },
        },
      },
      ClientListResponse: { type: 'array', items: { $ref: '#/components/schemas/ClientResponse' } },
      AttendancePageResponse: {
        type: 'object',
        required: ['items', 'page', 'limit', 'total'],
        properties: {
          items: { type: 'array', items: { $ref: '#/components/schemas/AttendanceResponse' } },
          page: { type: 'integer', minimum: 1 },
          limit: { type: 'integer', minimum: 1 },
          total: { type: 'integer', minimum: 0 },
        },
      },
      ProgressPageResponse: {
        type: 'object',
        required: ['items', 'page', 'limit', 'total'],
        properties: {
          items: { type: 'array', items: { $ref: '#/components/schemas/ProgressResponse' } },
          page: { type: 'integer', minimum: 1 },
          limit: { type: 'integer', minimum: 1 },
          total: { type: 'integer', minimum: 0 },
        },
      },
      CheckInRequest: {
        type: 'object',
        description: 'clientId is required for ADMIN and RECEPTION callers and omitted for CLIENT callers.',
        properties: { clientId: { type: 'integer', minimum: 1 } },
        additionalProperties: false,
      },
      CoachScheduleResponse: {
        type: 'object',
        required: ['id', 'coachId', 'dayOfWeek', 'startTime', 'endTime'],
        properties: {
          id: { type: 'integer', minimum: 1 },
          coachId: { type: 'integer', minimum: 1 },
          dayOfWeek: { type: 'integer', minimum: 1, maximum: 7, description: '1 = Monday, 7 = Sunday' },
          startTime: { type: 'string', pattern: '^([01]\\d|2[0-3]):[0-5]\\d$', example: '08:00' },
          endTime: { type: 'string', pattern: '^([01]\\d|2[0-3]):[0-5]\\d$', example: '16:00' },
        },
      },
      CoachScheduleListResponse: {
        type: 'array',
        items: { $ref: '#/components/schemas/CoachScheduleResponse' },
      },
      CreateCoachScheduleRequest: {
        type: 'object',
        required: ['dayOfWeek', 'startTime', 'endTime'],
        properties: {
          dayOfWeek: { type: 'integer', minimum: 1, maximum: 7 },
          startTime: { type: 'string', pattern: '^([01]\\d|2[0-3]):[0-5]\\d$', example: '08:00' },
          endTime: { type: 'string', pattern: '^([01]\\d|2[0-3]):[0-5]\\d$', example: '16:00' },
        },
        additionalProperties: false,
      },
      UpdateCoachScheduleRequest: {
        type: 'object',
        minProperties: 1,
        properties: {
          dayOfWeek: { type: 'integer', minimum: 1, maximum: 7 },
          startTime: { type: 'string', pattern: '^([01]\\d|2[0-3]):[0-5]\\d$' },
          endTime: { type: 'string', pattern: '^([01]\\d|2[0-3]):[0-5]\\d$' },
        },
        additionalProperties: false,
      },
      CoachResponse: {
        type: 'object', required: ['id', 'email', 'dni', 'name', 'lastName', 'phone', 'isActive'],
        properties: {
          id: { type: 'integer' }, email: { type: 'string', format: 'email' }, dni: { type: 'string' },
          name: { type: 'string' }, lastName: { type: 'string' }, phone: { type: 'string' }, isActive: { type: 'boolean' },
        },
      },
      CoachListResponse: { type: 'array', items: { $ref: '#/components/schemas/CoachResponse' } },
      CreateCoachRequest: { type: 'object', required: ['email', 'dni', 'name', 'lastName', 'phone'], properties: { email: { type: 'string', format: 'email' }, dni: { type: 'string' }, name: { type: 'string' }, lastName: { type: 'string' }, phone: { type: 'string' } } },
      UpdateCoachRequest: { type: 'object', minProperties: 1, properties: { email: { type: 'string', format: 'email' }, dni: { type: 'string' }, name: { type: 'string' }, lastName: { type: 'string' }, phone: { type: 'string' } } },
      MembershipResponse: {
        type: 'object', required: ['id', 'name', 'description', 'durationDays', 'maxDaysPerWeek', 'priceAmount', 'currency', 'isActive', 'stripePriceId'],
        properties: {
          id: { type: 'integer' }, name: { type: 'string' }, description: { type: 'string', nullable: true },
          durationDays: { type: 'integer' }, maxDaysPerWeek: { type: 'integer', nullable: true }, priceAmount: { type: 'number' },
          currency: { type: 'string' }, isActive: { type: 'boolean' }, stripePriceId: { type: 'string', nullable: true },
        },
      },
      MembershipListResponse: { type: 'array', items: { $ref: '#/components/schemas/MembershipResponse' } },
      CreateMembershipRequest: { type: 'object', required: ['name', 'durationDays', 'priceAmount'], properties: { name: { type: 'string' }, description: { type: 'string', nullable: true }, durationDays: { type: 'integer' }, maxDaysPerWeek: { type: 'integer', nullable: true }, priceAmount: { type: 'number' }, currency: { type: 'string', minLength: 3, maxLength: 3 }, stripePriceId: { type: 'string', nullable: true } } },
      UpdateMembershipRequest: { type: 'object', minProperties: 1, properties: { name: { type: 'string' }, description: { type: 'string', nullable: true }, durationDays: { type: 'integer' }, maxDaysPerWeek: { type: 'integer', nullable: true }, priceAmount: { type: 'number' } } },
      MembershipStatusRequest: { type: 'object', required: ['isActive'], properties: { isActive: { type: 'boolean' } }, additionalProperties: false },
      SubscriptionStatus: { type: 'string', enum: ['PENDING', 'ACTIVE', 'EXPIRED', 'CANCELLED'] },
      PaymentMethod: { type: 'string', enum: ['CARD', 'CASH', 'TRANSFER'] },
      CreateSubscriptionRequest: { type: 'object', required: ['clientId', 'membershipId', 'method'], properties: { clientId: { type: 'integer' }, membershipId: { type: 'integer' }, method: { $ref: '#/components/schemas/PaymentMethod' } }, additionalProperties: false },
      SubscriptionResponse: { type: 'object', required: ['id', 'clientId', 'membershipId', 'status', 'startDate', 'endDate', 'createdAt'], properties: { id: { type: 'integer' }, clientId: { type: 'integer' }, membershipId: { type: 'integer' }, status: { $ref: '#/components/schemas/SubscriptionStatus' }, startDate: { type: 'string', format: 'date-time', nullable: true }, endDate: { type: 'string', format: 'date-time', nullable: true }, createdAt: { type: 'string', format: 'date-time' } } },
      SubscriptionWithCheckoutResponse: { allOf: [{ $ref: '#/components/schemas/SubscriptionResponse' }, { type: 'object', required: ['checkoutUrl'], properties: { checkoutUrl: { type: 'string', format: 'uri', nullable: true } } }] },
      SubscriptionListResponse: { type: 'array', items: { $ref: '#/components/schemas/SubscriptionResponse' } },
      AttendanceResponse: { type: 'object', required: ['id', 'clientId', 'subscriptionId', 'checkInAt', 'checkOutAt', 'recordedById'], properties: { id: { type: 'integer' }, clientId: { type: 'integer' }, subscriptionId: { type: 'integer' }, checkInAt: { type: 'string', format: 'date-time' }, checkOutAt: { type: 'string', format: 'date-time', nullable: true }, recordedById: { type: 'integer', nullable: true } } },
      ExerciseResponse: { type: 'object', required: ['id', 'name', 'muscleGroup', 'equipment', 'description'], properties: { id: { type: 'integer' }, name: { type: 'string' }, muscleGroup: { type: 'string', enum: ['CHEST', 'BACK', 'SHOULDERS', 'ARMS', 'LEGS', 'GLUTES', 'CORE', 'CARDIO', 'FULL_BODY'] }, equipment: { type: 'string', nullable: true }, description: { type: 'string', nullable: true } } },
      ExerciseListResponse: { type: 'array', items: { $ref: '#/components/schemas/ExerciseResponse' } },
      CreateExerciseRequest: { type: 'object', required: ['name', 'muscleGroup'], properties: { name: { type: 'string' }, muscleGroup: { type: 'string', enum: ['CHEST', 'BACK', 'SHOULDERS', 'ARMS', 'LEGS', 'GLUTES', 'CORE', 'CARDIO', 'FULL_BODY'] }, equipment: { type: 'string', nullable: true }, description: { type: 'string', nullable: true } } },
      UpdateExerciseRequest: { type: 'object', minProperties: 1, properties: { name: { type: 'string' }, muscleGroup: { type: 'string', enum: ['CHEST', 'BACK', 'SHOULDERS', 'ARMS', 'LEGS', 'GLUTES', 'CORE', 'CARDIO', 'FULL_BODY'] }, equipment: { type: 'string', nullable: true }, description: { type: 'string', nullable: true } } },
      RoutineExerciseResponse: { type: 'object', required: ['id', 'routineId', 'exerciseId', 'dayNumber', 'position', 'sets', 'reps', 'weightKg', 'restSeconds', 'notes'], properties: { id: { type: 'integer' }, routineId: { type: 'integer' }, exerciseId: { type: 'integer' }, dayNumber: { type: 'integer' }, position: { type: 'integer' }, sets: { type: 'integer' }, reps: { type: 'integer' }, weightKg: { type: 'string', nullable: true }, restSeconds: { type: 'integer', nullable: true }, notes: { type: 'string', nullable: true }, exercise: { $ref: '#/components/schemas/ExerciseResponse' } } },
      RoutineResponse: { type: 'object', required: ['id', 'name', 'description', 'level', 'createdById', 'isActive', 'createdAt'], properties: { id: { type: 'integer' }, name: { type: 'string' }, description: { type: 'string', nullable: true }, level: { type: 'string', enum: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'] }, createdById: { type: 'integer' }, isActive: { type: 'boolean' }, createdAt: { type: 'string', format: 'date-time' }, exercises: { type: 'array', items: { $ref: '#/components/schemas/RoutineExerciseResponse' } } } },
      RoutineListResponse: { type: 'array', items: { $ref: '#/components/schemas/RoutineResponse' } },
      CreateRoutineRequest: { type: 'object', required: ['name', 'level'], properties: { name: { type: 'string' }, description: { type: 'string', nullable: true }, level: { type: 'string', enum: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'] }, createdById: { type: 'integer' }, exercises: { type: 'array', items: { $ref: '#/components/schemas/CreateRoutineExerciseRequest' } } } },
      UpdateRoutineRequest: { type: 'object', minProperties: 1, properties: { name: { type: 'string' }, description: { type: 'string', nullable: true }, level: { type: 'string', enum: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'] } } },
      CreateRoutineExerciseRequest: { type: 'object', required: ['exerciseId', 'dayNumber', 'position', 'sets', 'reps'], properties: { exerciseId: { type: 'integer' }, dayNumber: { type: 'integer' }, position: { type: 'integer' }, sets: { type: 'integer' }, reps: { type: 'integer' }, weightKg: { type: 'number', nullable: true }, restSeconds: { type: 'integer', nullable: true }, notes: { type: 'string', nullable: true } } },
      UpdateRoutineExerciseRequest: { type: 'object', properties: { exerciseId: { type: 'integer' }, dayNumber: { type: 'integer' }, position: { type: 'integer' }, sets: { type: 'integer' }, reps: { type: 'integer' }, weightKg: { type: 'number', nullable: true }, restSeconds: { type: 'integer', nullable: true }, notes: { type: 'string', nullable: true } }, minProperties: 1 },
      AssignmentResponse: { type: 'object', required: ['id', 'clientId', 'routineId', 'assignedById', 'status', 'startDate', 'endDate', 'notes'], properties: { id: { type: 'integer' }, clientId: { type: 'integer' }, routineId: { type: 'integer' }, assignedById: { type: 'integer' }, status: { type: 'string', enum: ['ACTIVE', 'COMPLETED', 'CANCELLED'] }, startDate: { type: 'string', format: 'date' }, endDate: { type: 'string', format: 'date', nullable: true }, notes: { type: 'string', nullable: true } } },
      AssignmentListResponse: { type: 'array', items: { $ref: '#/components/schemas/AssignmentResponse' } },
      CreateAssignmentRequest: { type: 'object', required: ['routineId', 'startDate'], properties: { clientId: { type: 'integer' }, routineId: { type: 'integer' }, assignedById: { type: 'integer' }, startDate: { type: 'string', format: 'date' }, endDate: { type: 'string', format: 'date', nullable: true }, notes: { type: 'string', nullable: true } } },
      AssignmentStatusRequest: { type: 'object', required: ['status'], properties: { status: { type: 'string', enum: ['COMPLETED', 'CANCELLED'] } }, additionalProperties: false },
      RoutineStatusRequest: { type: 'object', required: ['isActive'], properties: { isActive: { type: 'boolean' } }, additionalProperties: false },
      ProgressResponse: { type: 'object', required: ['id', 'clientId', 'recordedById', 'measuredAt', 'weightKg', 'heightCm', 'bodyFatPct', 'muscleKg', 'chestCm', 'waistCm', 'hipCm', 'armCm', 'thighCm', 'notes'], properties: { id: { type: 'integer' }, clientId: { type: 'integer' }, recordedById: { type: 'integer', nullable: true }, measuredAt: { type: 'string', format: 'date' }, weightKg: { type: 'number', nullable: true }, heightCm: { type: 'number', nullable: true }, bodyFatPct: { type: 'number', nullable: true }, muscleKg: { type: 'number', nullable: true }, chestCm: { type: 'number', nullable: true }, waistCm: { type: 'number', nullable: true }, hipCm: { type: 'number', nullable: true }, armCm: { type: 'number', nullable: true }, thighCm: { type: 'number', nullable: true }, notes: { type: 'string', nullable: true } } },
      CreateProgressRequest: { type: 'object', required: ['measuredAt'], properties: { clientId: { type: 'integer' }, measuredAt: { type: 'string', format: 'date' }, weightKg: { type: 'number', nullable: true }, heightCm: { type: 'number', nullable: true }, bodyFatPct: { type: 'number', nullable: true }, muscleKg: { type: 'number', nullable: true }, chestCm: { type: 'number', nullable: true }, waistCm: { type: 'number', nullable: true }, hipCm: { type: 'number', nullable: true }, armCm: { type: 'number', nullable: true }, thighCm: { type: 'number', nullable: true }, notes: { type: 'string', nullable: true } } },
      DashboardStatsResponse: { type: 'object', required: ['period', 'clients', 'memberships', 'revenue', 'attendance', 'payments', 'coachUsage'], properties: { period: { type: 'object', required: ['from', 'to'], properties: { from: { type: 'string', format: 'date' }, to: { type: 'string', format: 'date' } } }, clients: { type: 'object', required: ['active'], properties: { active: { type: 'integer' } } }, memberships: { type: 'object', required: ['active', 'expired'], properties: { active: { type: 'integer' }, expired: { type: 'integer' } } }, revenue: { type: 'object', required: ['amount', 'currency'], properties: { amount: { type: 'number' }, currency: { type: 'string', nullable: true } } }, attendance: { type: 'object', required: ['total'], properties: { total: { type: 'integer' } } }, payments: { type: 'array', items: { $ref: '#/components/schemas/PaymentStatusCount' } }, coachUsage: { type: 'array', items: { $ref: '#/components/schemas/CoachUsage' } } } },
      PaymentStatusCount: { type: 'object', required: ['status', 'count', 'amount'], properties: { status: { type: 'string' }, count: { type: 'integer' }, amount: { type: 'number' } } },
      CoachUsage: { type: 'object', required: ['coachId', 'coachName', 'routinesCreated', 'routineAssignments', 'progressRecords'], properties: { coachId: { type: 'integer' }, coachName: { type: 'string' }, routinesCreated: { type: 'integer' }, routineAssignments: { type: 'integer' }, progressRecords: { type: 'integer' } } },
      ReportRequest: { type: 'object', required: ['reportType'], properties: { reportType: { type: 'string', enum: ['dashboard-summary'] }, from: { type: 'string', format: 'date' }, to: { type: 'string', format: 'date' }, timezone: { type: 'string' } }, additionalProperties: false },
      ReportRequestResponse: { type: 'object', required: ['jobId'], properties: { jobId: { type: 'string' } } },
      PaymentResponse: { type: 'object', required: ['id', 'clientId', 'subscriptionId', 'method', 'status', 'amount', 'currency', 'refundedAmount', 'receiptUrl', 'recordedById', 'paidAt', 'createdAt'], properties: { id: { type: 'integer' }, clientId: { type: 'integer' }, subscriptionId: { type: 'integer' }, method: { $ref: '#/components/schemas/PaymentMethod' }, status: { type: 'string', enum: ['PENDING', 'SUCCEEDED', 'FAILED', 'REFUNDED'] }, amount: { type: 'number' }, currency: { type: 'string' }, refundedAmount: { type: 'number' }, receiptUrl: { type: 'string', format: 'uri', nullable: true }, recordedById: { type: 'integer', nullable: true }, paidAt: { type: 'string', format: 'date-time', nullable: true }, createdAt: { type: 'string', format: 'date-time' } } },
      PaymentListResponse: { type: 'array', items: { $ref: '#/components/schemas/PaymentResponse' } },
      ErrorResponse: { type: 'object', required: ['error'], properties: { error: { type: 'string' } } },
    },
    responses: {
      BadRequest: { description: 'Invalid request', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      Unauthorized: { description: 'Authentication required', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      Forbidden: { description: 'Insufficient permissions', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      NotFound: { description: 'Resource not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      Conflict: { description: 'Resource conflict', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
    },
  },
} as const
