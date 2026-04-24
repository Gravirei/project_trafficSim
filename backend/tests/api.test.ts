import request from 'supertest';
import app from '../src/app';

/**
 * REST endpoint integration tests.
 * Requires a running PostgreSQL instance (docker compose up -d in postgres-setup/).
 * Run: npm test
 */

describe('GET /api/health', () => {
    it('returns 200 with status ok', async () => {
        const res = await request(app).get('/api/health');
        expect(res.status).toBe(200);
        expect(res.body.status).toBe('ok');
        expect(res.body.timestamp).toBeDefined();
    });
});

describe('GET /api/signals', () => {
    it('returns 200 with an array', async () => {
        const res = await request(app).get('/api/signals');
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
    });
});

describe('POST /api/signals', () => {
    it('creates a new signal and returns 201', async () => {
        const res = await request(app)
            .post('/api/signals')
            .send({ name: `Test Signal ${Date.now()}`, green_duration: 20, red_duration: 20 });
        expect(res.status).toBe(201);
        expect(res.body.id).toBeDefined();
        expect(res.body.green_duration).toBe(20);
    });

    it('returns 400 when name is missing', async () => {
        const res = await request(app)
            .post('/api/signals')
            .send({ green_duration: 20 });
        expect(res.status).toBe(400);
    });
});

describe('GET /api/simulation/status', () => {
    it('returns 200 with running field', async () => {
        const res = await request(app).get('/api/simulation/status');
        expect(res.status).toBe(200);
        expect(typeof res.body.running).toBe('boolean');
    });
});

describe('GET /api/history', () => {
    it('returns 200 with an array', async () => {
        const res = await request(app).get('/api/history?limit=10');
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
    });
});
