import { Application, Request, Response } from 'express';
import swaggerUi from 'swagger-ui-express';
import {
  OpenAPIRegistry,
  OpenApiGeneratorV3,
  extendZodWithOpenApi,
} from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

// Augment z so its schemas expose `.openapi(...)` for the generator.
extendZodWithOpenApi(z);

// Re-import the route-level zod schemas to keep registration co-located
// with the OpenAPI definition (no mutation of the original schemas).
import { loginSchema, registerSchema, changePasswordSchema } from '../routes/auth.routes';
import { createSignalSchema, updateSignalSchema, idParamSchema } from '../routes/signals.routes';
import {
  modeSchema,
  speedSchema,
  lambdaSchema,
  thresholdSchema,
} from '../routes/simulation.routes';
import { historyQuerySchema } from '../routes/history.routes';

const registry = new OpenAPIRegistry();

// ---------------------------------------------------------------------------
// Security scheme (Bearer JWT)
// ---------------------------------------------------------------------------
registry.registerComponent('securitySchemes', 'bearerAuth', {
  type: 'http',
  scheme: 'bearer',
  bearerFormat: 'JWT',
  description: 'JWT token issued by POST /api/auth/login',
});

// ---------------------------------------------------------------------------
// Reusable response shapes
// ---------------------------------------------------------------------------
const ErrorResponse = z.object({
  error: z.string(),
  details: z.array(z.object({ path: z.string(), message: z.string() })).optional(),
});

const bearer = [{ bearerAuth: [] }];

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------
registry.registerPath({
  method: 'post',
  path: '/api/auth/login',
  summary: 'Log in with username, email, and password',
  tags: ['Auth'],
  request: { body: { content: { 'application/json': { schema: loginSchema } } } },
  responses: {
    200: {
      description: 'JWT token + user payload',
      content: {
        'application/json': {
          schema: z.object({
            token: z.string(),
            user: z.object({ id: z.number(), username: z.string(), role: z.string() }),
          }),
        },
      },
    },
    401: {
      description: 'Invalid credentials',
      content: { 'application/json': { schema: ErrorResponse } },
    },
    429: { description: 'Too many login attempts' },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/auth/me',
  summary: 'Get the currently authenticated user',
  tags: ['Auth'],
  security: bearer,
  responses: {
    200: {
      description: 'Current user',
      content: {
        'application/json': {
          schema: z.object({
            user: z.object({ id: z.number(), username: z.string(), role: z.string() }),
          }),
        },
      },
    },
    401: {
      description: 'Unauthenticated',
      content: { 'application/json': { schema: ErrorResponse } },
    },
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/auth/register',
  summary: 'Register a new user (Admin only)',
  tags: ['Auth'],
  security: bearer,
  request: { body: { content: { 'application/json': { schema: registerSchema } } } },
  responses: {
    201: {
      description: 'User created',
      content: {
        'application/json': {
          schema: z.object({
            id: z.number(),
            username: z.string(),
            email: z.string(),
            role: z.string(),
          }),
        },
      },
    },
    400: {
      description: 'Validation failed',
      content: { 'application/json': { schema: ErrorResponse } },
    },
    401: {
      description: 'Unauthenticated',
      content: { 'application/json': { schema: ErrorResponse } },
    },
    403: {
      description: 'Forbidden (Admin only)',
      content: { 'application/json': { schema: ErrorResponse } },
    },
    409: {
      description: 'Username already taken',
      content: { 'application/json': { schema: ErrorResponse } },
    },
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/auth/change-password',
  summary: 'Change a user password (Admin only)',
  tags: ['Auth'],
  security: bearer,
  request: { body: { content: { 'application/json': { schema: changePasswordSchema } } } },
  responses: {
    200: {
      description: 'Password updated',
      content: { 'application/json': { schema: z.object({ message: z.string() }) } },
    },
    400: {
      description: 'Validation failed',
      content: { 'application/json': { schema: ErrorResponse } },
    },
    404: {
      description: 'User not found',
      content: { 'application/json': { schema: ErrorResponse } },
    },
  },
});

// ---------------------------------------------------------------------------
// Signals
// ---------------------------------------------------------------------------
registry.registerPath({
  method: 'get',
  path: '/api/signals',
  summary: 'List all traffic signals',
  tags: ['Signals'],
  security: bearer,
  responses: {
    200: {
      description: 'List of signals',
      content: { 'application/json': { schema: z.object({ data: z.array(z.any()) }) } },
    },
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/signals',
  summary: 'Create a new signal (Admin only)',
  tags: ['Signals'],
  security: bearer,
  request: { body: { content: { 'application/json': { schema: createSignalSchema } } } },
  responses: {
    201: { description: 'Signal created', content: { 'application/json': { schema: z.any() } } },
    403: { description: 'Admin only', content: { 'application/json': { schema: ErrorResponse } } },
  },
});

registry.registerPath({
  method: 'put',
  path: '/api/signals/{id}',
  summary: 'Update signal configuration (Admin only)',
  tags: ['Signals'],
  security: bearer,
  request: {
    params: idParamSchema,
    body: { content: { 'application/json': { schema: updateSignalSchema } } },
  },
  responses: {
    200: { description: 'Updated signal', content: { 'application/json': { schema: z.any() } } },
    404: {
      description: 'Signal not found',
      content: { 'application/json': { schema: ErrorResponse } },
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/signals/{id}/stats',
  summary: 'Get current metrics for a signal',
  tags: ['Signals'],
  security: bearer,
  request: { params: idParamSchema },
  responses: {
    200: { description: 'Signal statistics', content: { 'application/json': { schema: z.any() } } },
    404: {
      description: 'Signal not found',
      content: { 'application/json': { schema: ErrorResponse } },
    },
  },
});

registry.registerPath({
  method: 'delete',
  path: '/api/signals/{id}',
  summary: 'Delete a signal (Admin only)',
  tags: ['Signals'],
  security: bearer,
  request: { params: idParamSchema },
  responses: {
    200: {
      description: 'Signal deleted',
      content: { 'application/json': { schema: z.object({ message: z.string() }) } },
    },
    404: {
      description: 'Signal not found',
      content: { 'application/json': { schema: ErrorResponse } },
    },
  },
});

// ---------------------------------------------------------------------------
// Simulation
// ---------------------------------------------------------------------------
const SimulationStatus = z.object({
  running: z.boolean(),
  currentTick: z.number(),
  mode: z.enum(['MANUAL', 'ADAPTIVE']),
  signalCount: z.number(),
  speedMultiplier: z.number(),
  arrivalRate: z.number(),
  adaptiveThreshold: z.number(),
});

registry.registerPath({
  method: 'post',
  path: '/api/simulation/start',
  summary: 'Start the simulation (Admin only)',
  tags: ['Simulation'],
  security: bearer,
  responses: {
    200: {
      description: 'Simulation started',
      content: {
        'application/json': { schema: z.object({ message: z.string(), status: SimulationStatus }) },
      },
    },
    400: {
      description: 'Simulation already running',
      content: { 'application/json': { schema: ErrorResponse } },
    },
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/simulation/stop',
  summary: 'Stop the simulation (Admin only)',
  tags: ['Simulation'],
  security: bearer,
  responses: {
    200: {
      description: 'Simulation stopped',
      content: {
        'application/json': { schema: z.object({ message: z.string(), status: SimulationStatus }) },
      },
    },
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/simulation/reset',
  summary: 'Reset the simulation (Admin only)',
  tags: ['Simulation'],
  security: bearer,
  responses: {
    200: {
      description: 'Simulation reset',
      content: {
        'application/json': { schema: z.object({ message: z.string(), status: SimulationStatus }) },
      },
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/simulation/status',
  summary: 'Get current simulation status',
  tags: ['Simulation'],
  security: bearer,
  responses: {
    200: {
      description: 'Current status',
      content: { 'application/json': { schema: SimulationStatus } },
    },
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/simulation/speed',
  summary: 'Set speed multiplier (Admin only)',
  tags: ['Simulation'],
  security: bearer,
  request: { body: { content: { 'application/json': { schema: speedSchema } } } },
  responses: {
    200: {
      description: 'Speed updated',
      content: {
        'application/json': { schema: z.object({ message: z.string(), status: SimulationStatus }) },
      },
    },
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/simulation/mode',
  summary: 'Set simulation mode (Admin only)',
  tags: ['Simulation'],
  security: bearer,
  request: { body: { content: { 'application/json': { schema: modeSchema } } } },
  responses: {
    200: {
      description: 'Mode updated',
      content: {
        'application/json': { schema: z.object({ message: z.string(), status: SimulationStatus }) },
      },
    },
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/simulation/arrival-rate',
  summary: 'Set arrival rate (Admin only)',
  tags: ['Simulation'],
  security: bearer,
  request: { body: { content: { 'application/json': { schema: lambdaSchema } } } },
  responses: {
    200: {
      description: 'Arrival rate updated',
      content: { 'application/json': { schema: z.object({ message: z.string() }) } },
    },
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/simulation/adaptive-threshold',
  summary: 'Set adaptive threshold (Admin only)',
  tags: ['Simulation'],
  security: bearer,
  request: { body: { content: { 'application/json': { schema: thresholdSchema } } } },
  responses: {
    200: {
      description: 'Threshold updated',
      content: {
        'application/json': { schema: z.object({ message: z.string(), status: SimulationStatus }) },
      },
    },
  },
});

// ---------------------------------------------------------------------------
// History
// ---------------------------------------------------------------------------
registry.registerPath({
  method: 'get',
  path: '/api/history',
  summary: 'Fetch historical queue data',
  tags: ['History'],
  security: bearer,
  request: { query: historyQuerySchema },
  responses: {
    200: {
      description: 'Paginated history rows',
      content: {
        'application/json': {
          schema: z.object({
            data: z.array(z.any()),
            meta: z.object({ limit: z.number(), count: z.number() }),
          }),
        },
      },
    },
  },
});

// ---------------------------------------------------------------------------
// Analytics
// ---------------------------------------------------------------------------
registry.registerPath({
  method: 'get',
  path: '/api/analytics/summary',
  summary: 'Aggregated system metrics',
  tags: ['Analytics'],
  security: bearer,
  responses: {
    200: {
      description: 'System summary',
      content: {
        'application/json': {
          schema: z.object({
            systemAvgWait: z.number(),
            peakQueueLength: z.number(),
            avgUtilization: z.number(),
            totalRecords: z.number(),
          }),
        },
      },
    },
  },
});

// ---------------------------------------------------------------------------
// Document generation
// ---------------------------------------------------------------------------
export function generateOpenApiDocument(): ReturnType<OpenApiGeneratorV3['generateDocument']> {
  const generator = new OpenApiGeneratorV3(registry.definitions);
  return generator.generateDocument({
    openapi: '3.0.3',
    info: {
      title: 'Traffic Simulation API',
      version: '1.0.0',
      description:
        'REST API for the Traffic Signal Simulation backend. Authenticate via POST /api/auth/login to obtain a JWT, then use the "Authorize" button to apply it to all protected endpoints.',
    },
    servers: [{ url: 'http://localhost:3001', description: 'Local dev' }],
    tags: [
      { name: 'Auth', description: 'Login, registration, password changes' },
      { name: 'Signals', description: 'Traffic signal CRUD and live stats' },
      { name: 'Simulation', description: 'Control the running simulation engine' },
      { name: 'History', description: 'Historical queue data' },
      { name: 'Analytics', description: 'Aggregated system metrics' },
    ],
  });
}

/**
 * Mounts Swagger UI and the raw OpenAPI JSON endpoint on the given app.
 * Call after express.json() and corsMiddleware so docs aren't rate-limited.
 */
export function setupOpenApi(app: Application): void {
  const document = generateOpenApiDocument();
  app.get('/api/openapi.json', (_req: Request, res: Response) => {
    res.json(document);
  });
  app.use(
    '/api/docs',
    swaggerUi.serve,
    swaggerUi.setup(document, {
      customSiteTitle: 'Traffic Simulation API Docs',
    })
  );
}
