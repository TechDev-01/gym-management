const idParameter = {
  name: 'id',
  in: 'path',
  required: true,
  schema: { type: 'integer', minimum: 1 },
}

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

const success = (schema = 'GenericResponse', status = '200') => ({
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
      get: { tags: ['Coaches'], summary: 'List coaches', responses: success('GenericListResponse') },
      post: {
        tags: ['Coaches'],
        summary: 'Create a coach',
        requestBody: jsonBody('GenericObject'),
        responses: success('GenericResponse', '201'),
      },
    },
    '/coaches/{id}': {
      parameters: [idParameter],
      get: { tags: ['Coaches'], summary: 'Get a coach', responses: success('GenericResponse') },
      patch: {
        tags: ['Coaches'],
        summary: 'Update a coach',
        requestBody: jsonBody('GenericObject'),
        responses: success('GenericResponse'),
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
      get: { tags: ['Memberships'], summary: 'List memberships', ...secured(['ADMIN', 'RECEPTION', 'CLIENT']), responses: success('GenericListResponse') },
      post: { tags: ['Memberships'], summary: 'Create a membership', ...secured(['ADMIN', 'RECEPTION']), requestBody: jsonBody('GenericObject'), responses: success('GenericResponse', '201') },
    },
    '/memberships/{id}': {
      parameters: [idParameter],
      get: { tags: ['Memberships'], summary: 'Get a membership', ...secured(['ADMIN', 'RECEPTION', 'CLIENT']), responses: success('GenericResponse') },
      patch: { tags: ['Memberships'], summary: 'Update a membership', ...secured(['ADMIN', 'RECEPTION']), requestBody: jsonBody('GenericObject'), responses: success('GenericResponse') },
    },
    '/memberships/{id}/status': {
      parameters: [idParameter],
      patch: { tags: ['Memberships'], summary: 'Change membership status', ...secured(['ADMIN']), requestBody: jsonBody('GenericObject'), responses: success('GenericResponse') },
    },
    '/memberships/{id}/subscriptions': {
      parameters: [idParameter],
      post: { tags: ['Memberships'], summary: 'Create a subscription', ...secured(['ADMIN', 'RECEPTION', 'CLIENT']), requestBody: jsonBody('GenericObject'), responses: success('GenericResponse', '201') },
    },
    '/subscriptions': {
      get: { tags: ['Subscriptions'], summary: 'List subscriptions', ...secured(['ADMIN', 'RECEPTION', 'CLIENT']), responses: success('GenericListResponse') },
    },
    '/subscriptions/{id}': {
      parameters: [idParameter],
      get: { tags: ['Subscriptions'], summary: 'Get a subscription', ...secured(['ADMIN', 'RECEPTION', 'CLIENT']), responses: success('GenericResponse') },
    },
    '/subscriptions/{id}/cancel': {
      parameters: [idParameter],
      post: { tags: ['Subscriptions'], summary: 'Cancel a subscription', ...secured(['ADMIN', 'RECEPTION']), responses: success('GenericResponse') },
    },
    '/subscriptions/{id}/payment-confirmation': {
      parameters: [idParameter],
      post: { tags: ['Subscriptions'], summary: 'Confirm a manual payment', ...secured(['ADMIN', 'RECEPTION']), responses: success('GenericResponse') },
    },
    '/attendance': {
      get: { tags: ['Attendance'], summary: 'List attendance records', ...secured(['ADMIN', 'RECEPTION', 'CLIENT']), responses: success('AttendancePageResponse') },
    },
    '/attendance/check-in': {
      post: { tags: ['Attendance'], summary: 'Check in a client', ...secured(['ADMIN', 'RECEPTION', 'CLIENT']), requestBody: jsonBody('CheckInRequest'), responses: success('GenericResponse', '201') },
    },
    '/attendance/{id}/check-out': {
      parameters: [idParameter],
      post: { tags: ['Attendance'], summary: 'Check out a client', ...secured(['ADMIN', 'RECEPTION', 'CLIENT']), responses: success('GenericResponse') },
    },
    '/routines': {
      get: { tags: ['Routines'], summary: 'List routines', ...secured(), responses: success('GenericListResponse') },
      post: { tags: ['Routines'], summary: 'Create a routine', ...secured(['ADMIN', 'COACH']), requestBody: jsonBody('GenericObject'), responses: success('GenericResponse', '201') },
    },
    '/routines/{id}': {
      parameters: [idParameter],
      get: { tags: ['Routines'], summary: 'Get a routine', ...secured(), responses: success('GenericResponse') },
      patch: { tags: ['Routines'], summary: 'Update a routine', ...secured(['ADMIN', 'COACH']), requestBody: jsonBody('GenericObject'), responses: success('GenericResponse') },
    },
    '/routines/exercises': {
      get: { tags: ['Routines'], summary: 'List exercises', ...secured(), responses: success('GenericListResponse') },
      post: { tags: ['Routines'], summary: 'Create an exercise', ...secured(['ADMIN', 'COACH']), requestBody: jsonBody('GenericObject'), responses: success('GenericResponse', '201') },
    },
    '/routines/exercises/{id}': {
      parameters: [idParameter],
      get: { tags: ['Routines'], summary: 'Get an exercise', ...secured(), responses: success('GenericResponse') },
      patch: { tags: ['Routines'], summary: 'Update an exercise', ...secured(['ADMIN', 'COACH']), requestBody: jsonBody('GenericObject'), responses: success('GenericResponse') },
    },
    '/routines/assignments': {
      get: { tags: ['Routines'], summary: 'List routine assignments', ...secured(), responses: success('GenericListResponse') },
      post: { tags: ['Routines'], summary: 'Assign a routine', ...secured(['ADMIN', 'COACH']), requestBody: jsonBody('GenericObject'), responses: success('GenericResponse', '201') },
    },
    '/routines/assignments/{id}': {
      parameters: [idParameter],
      get: { tags: ['Routines'], summary: 'Get a routine assignment', ...secured(), responses: success('GenericResponse') },
    },
    '/routines/assignments/{id}/status': {
      parameters: [idParameter],
      post: { tags: ['Routines'], summary: 'Update assignment status', ...secured(['ADMIN', 'COACH']), requestBody: jsonBody('GenericObject'), responses: success('GenericResponse') },
    },
    '/routines/{id}/status': {
      parameters: [idParameter],
      patch: { tags: ['Routines'], summary: 'Change routine status', ...secured(['ADMIN', 'COACH']), requestBody: jsonBody('GenericObject'), responses: success('GenericResponse') },
    },
    '/routines/{id}/exercises': {
      parameters: [idParameter],
      post: { tags: ['Routines'], summary: 'Add an exercise to a routine', ...secured(['ADMIN', 'COACH']), requestBody: jsonBody('GenericObject'), responses: success('GenericResponse', '201') },
    },
    '/routines/{id}/exercises/{routineExerciseId}': {
      parameters: [idParameter, { name: 'routineExerciseId', in: 'path', required: true, schema: { type: 'integer', minimum: 1 } }],
      patch: { tags: ['Routines'], summary: 'Update a routine exercise', ...secured(['ADMIN', 'COACH']), requestBody: jsonBody('GenericObject'), responses: success('GenericResponse') },
      delete: { tags: ['Routines'], summary: 'Remove an exercise from a routine', ...secured(['ADMIN', 'COACH']), responses: { '204': { description: 'Exercise removed' } } },
    },
    '/progress': {
      get: { tags: ['Progress'], summary: 'List progress records', ...secured(), responses: success('ProgressPageResponse') },
      post: { tags: ['Progress'], summary: 'Create a progress record', ...secured(['ADMIN', 'COACH', 'CLIENT']), requestBody: jsonBody('GenericObject'), responses: success('GenericResponse', '201') },
    },
    '/progress/{id}': {
      parameters: [idParameter],
      get: { tags: ['Progress'], summary: 'Get a progress record', ...secured(), responses: success('GenericResponse') },
    },
    '/stats/dashboard': {
      get: { tags: ['Stats'], summary: 'Get administrative dashboard statistics', ...secured(['ADMIN', 'RECEPTION']), responses: success('GenericResponse') },
    },
    '/stats/reports': {
      post: { tags: ['Stats'], summary: 'Request an administrative report', ...secured(['ADMIN', 'RECEPTION']), requestBody: jsonBody('GenericObject'), responses: success('GenericResponse', '202') },
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
      get: { tags: ['Payments'], summary: 'List payments', ...secured(['ADMIN', 'RECEPTION']), responses: success('GenericListResponse') },
    },
    '/payments/{id}': {
      parameters: [idParameter],
      get: { tags: ['Payments'], summary: 'Get a payment', ...secured(['ADMIN', 'RECEPTION']), responses: success('GenericResponse') },
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
      GenericObject: { type: 'object', additionalProperties: true },
      GenericResponse: { type: 'object', additionalProperties: true },
      ReportStatusResponse: {
        type: 'object',
        required: ['jobId', 'reportType', 'status'],
        properties: {
          jobId: { type: 'string' },
          reportType: { type: 'string', example: 'dashboard-summary' },
          status: { type: 'string', enum: ['pending', 'completed', 'failed'] },
          requestedAt: { type: 'string', format: 'date-time', nullable: true },
          finishedAt: { type: 'string', format: 'date-time', nullable: true },
          result: { type: 'object', additionalProperties: true, nullable: true },
          error: { type: 'string', nullable: true },
        },
      },
      GenericListResponse: { type: 'array', items: { $ref: '#/components/schemas/GenericObject' } },
      HealthResponse: { type: 'object', required: ['status'], properties: { status: { type: 'string', example: 'ok' } } },
      ModuleHealthResponse: { type: 'object', required: ['status', 'module'], properties: { status: { type: 'string', example: 'ok' }, module: { type: 'string' } } },
      LoginRequest: { type: 'object', required: ['email', 'password'], properties: { email: { type: 'string', format: 'email' }, password: { type: 'string', minLength: 1 } } },
      RegisterRequest: { type: 'object', required: ['email', 'password', 'role'], properties: { email: { type: 'string', format: 'email' }, password: { type: 'string', minLength: 8 }, role: { type: 'string', enum: ['ADMIN', 'RECEPTION'] } } },
      AuthResponse: { type: 'object', additionalProperties: true, description: 'Authenticated user and JWT payload' },
      CreateClientRequest: { type: 'object', required: ['email', 'dni', 'name', 'lastName', 'phone'], properties: { email: { type: 'string', format: 'email' }, password: { type: 'string', minLength: 8 }, dni: { type: 'string' }, name: { type: 'string' }, lastName: { type: 'string' }, phone: { type: 'string' } } },
      UpdateClientRequest: { type: 'object', minProperties: 1, properties: { email: { type: 'string', format: 'email' }, dni: { type: 'string' }, name: { type: 'string' }, lastName: { type: 'string' }, phone: { type: 'string' } } },
      ClientResponse: { type: 'object', additionalProperties: true },
      ClientListResponse: { type: 'array', items: { $ref: '#/components/schemas/ClientResponse' } },
      AttendancePageResponse: {
        type: 'object',
        required: ['items', 'page', 'limit', 'total'],
        properties: {
          items: { type: 'array', items: { $ref: '#/components/schemas/GenericObject' } },
          page: { type: 'integer', minimum: 1 },
          limit: { type: 'integer', minimum: 1 },
          total: { type: 'integer', minimum: 0 },
        },
      },
      ProgressPageResponse: {
        type: 'object',
        required: ['items', 'page', 'limit', 'total'],
        properties: {
          items: { type: 'array', items: { $ref: '#/components/schemas/GenericObject' } },
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
