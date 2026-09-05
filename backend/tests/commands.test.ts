import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../src/app';
import { env } from '../src/config/env';
import { auditRunner } from '../src/engine/auditRunner';
import type { JunctionDef } from '../src/models/junction.model';
import type { PhaseDurations } from '../src/models/phaseDuration.model';

/**
 * Integration tests for the Phase 4 command + telemetry routes.
 * Mocks the model layer so the suite runs without a real DB. This is
 * the same pattern as junctionEngine/auditRunner tests.
 */

// --- Fixture data ---
// These constants are referenced by the mock factory below. `jest.mock` is
// hoisted to the top of the file by babel, so we cannot reference them
// directly in the factory. The workaround: define them inside the mock
// factory and export them onto `globalThis` so the tests can read them.
const fixtureStore = (() => {
  const CROSS: JunctionDef = {
    id: 'cross',
    code: 'J07',
    name: 'CENTRAL CROSS',
    shape: 'cross',
    legs: 4,
    leg_angles: [0, 90, 180, 270],
    leg_names: ['E', 'N', 'W', 'S'],
    leg_full: ['EAST', 'NORTH', 'WEST', 'SOUTH'],
    map_pos: { x: 560, y: 360 },
    geometry: { hw: 60 },
    phases: [
      { name: 'E·W', short: 'E·W', dur: 'thru', moves: [[0, 'T'], [2, 'T']] },
      { name: 'E·W L', short: 'E·W·L', dur: 'left', moves: [[0, 'L'], [2, 'L']] },
      { name: 'N·S', short: 'N·S', dur: 'thru', moves: [[1, 'T'], [3, 'T']] },
      { name: 'N·S L', short: 'N·S·L', dur: 'left', moves: [[1, 'L'], [3, 'L']] },
    ],
    move_w: { L: 0.22, T: 0.5, R: 0.28, '*': 0 },
    created_at: new Date(0),
  };

  const PENTA: JunctionDef = {
    ...CROSS,
    id: 'penta',
    code: 'J45',
    name: 'CIVIC PENTA',
    shape: 'penta',
    legs: 5,
    leg_angles: [90, 162, 234, 306, 18],
    leg_names: ['S', 'SW', 'NW', 'N', 'NE'],
    leg_full: ['S', 'SW', 'NW', 'N', 'NE'],
    map_pos: { x: 240, y: 1000 },
    phases: [
      { name: 'S·N', short: 'S·N', dur: 'thru', moves: [[0, 'T'], [3, 'T']] },
      { name: 'S·N L', short: 'S·N·L', dur: 'left', moves: [[0, 'L'], [3, 'L']] },
      { name: 'SW·NE', short: 'SW·NE', dur: 'thru', moves: [[1, 'T'], [4, 'T']] },
      { name: 'SW·NE L', short: 'SW·NE·L', dur: 'left', moves: [[1, 'L'], [4, 'L']] },
      { name: 'NW', short: 'NW', dur: 'left', moves: [[2, 'L'], [2, 'T'], [2, 'R']] },
    ],
  };

  // Three more minimal 4-leg fixtures so the test can verify a list of 5.
  const makeJ = (
    id: string,
    code: string,
    name: string,
    shape: 'cross' | 'round' | 'y' | 't',
    angles: number[],
  ): JunctionDef => ({
    ...CROSS,
    id,
    code,
    name,
    shape,
    legs: angles.length,
    leg_angles: angles,
    leg_names: angles.map((_, i) => `L${i}`),
    leg_full: angles.map((_, i) => `LEG ${i}`),
  });
  const ROUND = makeJ('round', 'J12', 'RING PLAZA', 'round', [0, 90, 180, 270]);
  const Y = makeJ('y', 'J21', 'MERIDIAN SPLIT', 'y', [0, 120, 240]);
  const T = makeJ('t', 'J33', 'HARBOR TEE', 't', [0, 90, 180]);

  const DURS: PhaseDurations = {
    junction_id: 'cross',
    thru: 12,
    left: 8,
    yellow: 3,
    allred: 1,
    truck_share: 0.1,
    updated_at: new Date(0),
  };

  return { CROSS, PENTA, ROUND, Y, T, DURS };
})();

const { CROSS, PENTA, ROUND, Y, T, DURS } = fixtureStore;

// --- Mocks ---
jest.mock('../src/models/junction.model', () => ({
  JunctionModel: {
    getAll: jest.fn().mockImplementation(async () => {
      const { CROSS, ROUND, Y, T, PENTA } = (globalThis as { __FIXTURES__?: typeof fixtureStore }).__FIXTURES__!;
      return [CROSS, ROUND, Y, T, PENTA];
    }),
    getById: jest.fn().mockImplementation(async (id: string) => {
      const { CROSS, ROUND, Y, T, PENTA } = (globalThis as { __FIXTURES__?: typeof fixtureStore }).__FIXTURES__!;
      if (id === 'cross') return CROSS;
      if (id === 'round') return ROUND;
      if (id === 'y') return Y;
      if (id === 't') return T;
      if (id === 'penta') return PENTA;
      return null;
    }),
    upsert: jest.fn().mockImplementation(async (def: JunctionDef) => def),
    delete: jest.fn().mockResolvedValue(true),
  },
}));

jest.mock('../src/models/phaseDuration.model', () => ({
  PhaseDurationModel: {
    getByJunctionId: jest.fn().mockImplementation(async (id: string) => {
      const { DURS } = (globalThis as { __FIXTURES__?: typeof fixtureStore }).__FIXTURES__!;
      return id === 'cross' ? DURS : null;
    }),
    getAll: jest.fn().mockImplementation(async () => {
      const { DURS } = (globalThis as { __FIXTURES__?: typeof fixtureStore }).__FIXTURES__!;
      return [DURS];
    }),
    update: jest.fn().mockImplementation(
      async (id: string, patch: Partial<PhaseDurations>) => {
        const { DURS } = (globalThis as { __FIXTURES__?: typeof fixtureStore }).__FIXTURES__!;
        return { ...DURS, ...patch, junction_id: id };
      },
    ),
  },
}));

jest.mock('../src/models/eventLog.model', () => ({
  EventLogModel: {
    append: jest.fn().mockResolvedValue({ id: 1 }),
    getSince: jest.fn().mockResolvedValue([]),
    getRecent: jest.fn().mockResolvedValue([]),
  },
}));

// Make fixtures available to the mock factories via globalThis.
(globalThis as { __FIXTURES__?: typeof fixtureStore }).__FIXTURES__ = fixtureStore;

function makeToken(role: 'ADMIN' | 'VIEWER' = 'ADMIN'): string {
  return jwt.sign({ id: 1, username: 'testadmin', role }, env.JWT_SECRET, {
    expiresIn: '1h',
  });
}
const adminToken = makeToken('ADMIN');
const viewerToken = makeToken('VIEWER');
const auth = (token: string) => `Bearer ${token}`;

beforeAll(async () => {
  // Drop the global auditRunner state from any prior suite, then init fresh.
  (auditRunner as unknown as { engines: Map<string, unknown> }).engines = new Map();
  await auditRunner.initialize();
});

describe('GET /api/junctions', () => {
  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/junctions');
    expect(res.status).toBe(401);
  });

  it('returns array of 5 seeded junctions when authenticated', async () => {
    const res = await request(app)
      .get('/api/junctions')
      .set('Authorization', auth(adminToken));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    const ids = res.body.data.map((j: { id: string }) => j.id);
    expect(ids).toEqual(expect.arrayContaining(['cross', 'round', 'y', 't', 'penta']));
  });

  it('returns single junction for GET /:id', async () => {
    const res = await request(app)
      .get('/api/junctions/cross')
      .set('Authorization', auth(adminToken));
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe('cross');
    expect(res.body.data.code).toBe('J07');
  });

  it('returns 404 for unknown junction', async () => {
    const res = await request(app)
      .get('/api/junctions/nope')
      .set('Authorization', auth(adminToken));
    expect(res.status).toBe(404);
  });
});

describe('PUT /api/junctions/:id/durations', () => {
  it('returns 401 without auth', async () => {
    const res = await request(app)
      .put('/api/junctions/cross/durations')
      .send({ thru: 20 });
    expect(res.status).toBe(401);
  });

  it('returns 403 for VIEWER', async () => {
    const res = await request(app)
      .put('/api/junctions/cross/durations')
      .set('Authorization', auth(viewerToken))
      .send({ thru: 20 });
    expect(res.status).toBe(403);
  });

  it('returns 200 for ADMIN with valid body', async () => {
    const res = await request(app)
      .put('/api/junctions/cross/durations')
      .set('Authorization', auth(adminToken))
      .send({ thru: 20 });
    expect(res.status).toBe(200);
    expect(res.body.data.thru).toBe(20);
  });

  it('returns 400 for out-of-range value', async () => {
    const res = await request(app)
      .put('/api/junctions/cross/durations')
      .set('Authorization', auth(adminToken))
      .send({ thru: 999 });
    expect(res.status).toBe(400);
  });
});

describe('POST /api/commands/:id/reset', () => {
  it('returns 200 for ADMIN', async () => {
    const res = await request(app)
      .post('/api/commands/cross/reset')
      .set('Authorization', auth(adminToken));
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it('returns 403 for VIEWER', async () => {
    const res = await request(app)
      .post('/api/commands/cross/reset')
      .set('Authorization', auth(viewerToken));
    expect(res.status).toBe(403);
  });

  it('returns 400 on bad body for set-mode', async () => {
    const res = await request(app)
      .post('/api/commands/cross/set-mode')
      .set('Authorization', auth(adminToken))
      .send({ mode: 'invalid' });
    expect(res.status).toBe(400);
  });

  it('returns 404 for unknown junction', async () => {
    const res = await request(app)
      .post('/api/commands/nope/reset')
      .set('Authorization', auth(adminToken));
    expect(res.status).toBe(404);
  });
});

describe('POST /api/commands/:id/preempt', () => {
  it('returns 200 for ADMIN with valid leg', async () => {
    const res = await request(app)
      .post('/api/commands/cross/preempt')
      .set('Authorization', auth(adminToken))
      .send({ leg: 1 });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it('returns 400 for second preempt while one active', async () => {
    const res = await request(app)
      .post('/api/commands/cross/preempt')
      .set('Authorization', auth(adminToken))
      .send({ leg: 2 });
    expect(res.status).toBe(400);
    expect(res.body.ok).toBe(false);
  });

  it('returns 400 for invalid leg', async () => {
    const res = await request(app)
      .post('/api/commands/cross/preempt')
      .set('Authorization', auth(adminToken))
      .send({ leg: 99 });
    expect(res.status).toBe(400);
  });
});

describe('POST /api/commands/:id/ped-call', () => {
  it('returns 200 for ADMIN', async () => {
    const res = await request(app)
      .post('/api/commands/cross/ped-call')
      .set('Authorization', auth(adminToken))
      .send({ side: 1 });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });
});

describe('POST /api/commands/:id/force-phase', () => {
  it('returns 200 with valid phase', async () => {
    const res = await request(app)
      .post('/api/commands/cross/force-phase')
      .set('Authorization', auth(adminToken))
      .send({ phase: 2 });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it('returns 400 with invalid phase', async () => {
    const res = await request(app)
      .post('/api/commands/cross/force-phase')
      .set('Authorization', auth(adminToken))
      .send({ phase: 99 });
    expect(res.status).toBe(400);
  });
});

describe('POST /api/commands/:id/set-mode', () => {
  it('returns 200 with valid mode', async () => {
    const res = await request(app)
      .post('/api/commands/cross/set-mode')
      .set('Authorization', auth(adminToken))
      .send({ mode: 'manual' });
    expect(res.status).toBe(200);
    expect(res.body.status.mode).toBe('manual');
  });
});

describe('POST /api/commands/:id/snapshot (client → audit push)', () => {
  it('returns 200 without ADMIN', async () => {
    const res = await request(app)
      .post('/api/commands/cross/snapshot')
      .set('Authorization', auth(viewerToken))
      .send({
        junctionId: 'cross',
        simT: 1,
        phase: 0,
        interval: 'G',
        queues: [0, 0, 0, 0],
        served: 0,
        waitAvg: 0,
        waitMax: 0,
        pushedAt: Date.now(),
      });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it('returns 400 when junctionId does not match', async () => {
    const res = await request(app)
      .post('/api/commands/cross/snapshot')
      .set('Authorization', auth(viewerToken))
      .send({
        junctionId: 'penta',
        simT: 1,
        phase: 0,
        interval: 'G',
        queues: [0, 0, 0, 0],
        served: 0,
        waitAvg: 0,
        waitMax: 0,
        pushedAt: Date.now(),
      });
    expect(res.status).toBe(400);
  });
});

describe('GET /api/telemetry', () => {
  it('GET /junctions returns array of 5', async () => {
    const res = await request(app)
      .get('/api/telemetry/junctions')
      .set('Authorization', auth(adminToken));
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(5);
    for (const j of res.body.data) {
      expect(j).toHaveProperty('id');
      expect(j).toHaveProperty('phase');
      expect(j).toHaveProperty('interval');
    }
  });

  it('GET /junction/:id returns full snapshot', async () => {
    const res = await request(app)
      .get('/api/telemetry/junction/cross')
      .set('Authorization', auth(adminToken));
    expect(res.status).toBe(200);
    expect(res.body.data.phase).toBeDefined();
    expect(res.body.data.interval).toBeDefined();
    expect(res.body.data.queues).toHaveLength(4);
  });

  it('GET /junction/penta returns 5-leg snapshot', async () => {
    const res = await request(app)
      .get('/api/telemetry/junction/penta')
      .set('Authorization', auth(adminToken));
    expect(res.status).toBe(200);
    expect(res.body.data.queues).toHaveLength(5);
  });

  it('GET /junction/:id/events returns array', async () => {
    const res = await request(app)
      .get('/api/telemetry/junction/cross/events?sinceMs=0&limit=20')
      .set('Authorization', auth(adminToken));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('GET /junction/:id/drifts is ADMIN-only', async () => {
    const res = await request(app)
      .get('/api/telemetry/junction/cross/drifts')
      .set('Authorization', auth(viewerToken));
    expect(res.status).toBe(403);
  });
});
