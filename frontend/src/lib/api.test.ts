// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// We re-import inside beforeEach to get a fresh module instance each time
// because api.ts keeps an in-memory `authToken`.
async function loadApi() {
  vi.resetModules();
  return await import('./api');
}

describe('lib/api', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('attaches Authorization header when a token is set via setToken', async () => {
    const { api } = await loadApi();
    const fetchMock = vi.fn<(url: string, init?: RequestInit) => Promise<Response>>(async () => {
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    });
    vi.stubGlobal('fetch', fetchMock);

    api.setToken('test-token-abc');
    await api.getSignals();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const calledWith = fetchMock.mock.calls[0];
    const initArg = calledWith[1] as RequestInit | undefined;
    const headers = (initArg?.headers || {}) as Record<string, string>;
    expect(headers['Authorization']).toBe('Bearer test-token-abc');
  });

  it('clears auth_token from localStorage on 401 for non-auth endpoints', async () => {
    const { api } = await loadApi();
    localStorage.setItem('auth_token', 'stale-token');
    localStorage.setItem('auth_user', JSON.stringify({ id: 1, username: 'a', role: 'ADMIN' }));

    const fetchMock = vi.fn(async () => {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(api.getSignals()).rejects.toThrow();

    expect(localStorage.getItem('auth_token')).toBeNull();
    expect(localStorage.getItem('auth_user')).toBeNull();
  });

  it('throws an ApiError containing status and message on a non-OK response', async () => {
    const { api } = await loadApi();
    const fetchMock = vi.fn(async () => {
      return new Response(JSON.stringify({ error: 'Something went wrong' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    });
    vi.stubGlobal('fetch', fetchMock);

    try {
      await api.getSignals();
      throw new Error('Expected api.getSignals() to throw');
    } catch (err) {
      expect(err).toBeInstanceOf(Error);
      const e = err as Error & { status?: number };
      expect(e.status).toBe(500);
      expect(e.message).toBe('Something went wrong');
    }
  });
});
