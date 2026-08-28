import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../src/app';
import { env } from '../src/config/env';

/**
 * REST endpoint integration tests.
 * Requires a running PostgreSQL instance (docker compose up -d in postgres-setup/).
 * Run: npm test
 */

function makeToken(role: 'ADMIN' | 'VIEWER' = 'ADMIN'): string {
  const payload = { id: 1, username: 'testadmin', role };
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: '1h' });
}

const adminToken = makeToken('ADMIN');
const viewerToken = makeToken('VIEWER');
const authHeader = (token: string) => `Bearer ${token}`;

describe('GET /api/health', () => {
  it('returns 200 with status ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.timestamp).toBeDefined();
  });
});

describe('GET /api/ready', () => {
  it('returns 200 or 503 depending on DB', async () => {
    const res = await request(app).get('/api/ready');
    expect([200, 503]).toContain(res.status);
  });
});

describe('GET /api/signals', () => {
  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/signals');
    expect(res.status).toBe(401);
  });

  it('returns 200 with data array when authenticated', async () => {
    const res = await request(app)
      .get('/api/signals')
      .set('Authorization', authHeader(adminToken));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});

describe('POST /api/signals', () => {
  it('creates a new signal and returns 201 (ADMIN)', async () => {
    const res = await request(app)
      .post('/api/signals')
      .set('Authorization', authHeader(adminToken))
      .send({ name: `Test Signal ${Date.now()}`, green_duration: 20, red_duration: 20 });
    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.green_duration).toBe(20);
  });

  it('returns 400 when name is missing', async () => {
    const res = await request(app)
      .post('/api/signals')
      .set('Authorization', authHeader(adminToken))
      .send({ green_duration: 20 });
    expect(res.status).toBe(400);
  });

  it('returns 403 when VIEWER tries to create', async () => {
    const res = await request(app)
      .post('/api/signals')
      .set('Authorization', authHeader(viewerToken))
      .send({ name: `Viewer Fail ${Date.now()}` });
    expect(res.status).toBe(403);
  });
});

describe('GET /api/simulation/status', () => {
  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/simulation/status');
    expect(res.status).toBe(401);
  });

  it('returns 200 with running field when authenticated', async () => {
    const res = await request(app)
      .get('/api/simulation/status')
      .set('Authorization', authHeader(viewerToken));
    expect(res.status).toBe(200);
    expect(typeof res.body.running).toBe('boolean');
  });
});

describe('GET /api/history', () => {
  it('returns 200 with data array when authenticated', async () => {
    const res = await request(app)
      .get('/api/history?limit=10')
      .set('Authorization', authHeader(viewerToken));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});
