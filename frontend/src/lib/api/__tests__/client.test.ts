import { createApi, ApiError } from '../client';

describe('createApi', () => {
  function makeFetch(responses: Array<{ status: number; body: unknown }>): typeof fetch {
    let i = 0;
    return (async (_url: string, init?: RequestInit) => {
      const r = responses[i++] ?? { status: 200, body: {} };
      const headers = new Headers({ 'content-type': 'application/json' });
      return new Response(JSON.stringify(r.body), { status: r.status, headers });
    }) as unknown as typeof fetch;
  }

  it('login sends username (derived from email) + email + password', async () => {
    let captured: { url: string; init: RequestInit } | null = null;
    const fetchImpl = (async (url: string, init: RequestInit) => {
      captured = { url, init };
      return new Response(JSON.stringify({ token: 't', user: { id: 1, username: 'admin', role: 'ADMIN' } }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }) as unknown as typeof fetch;
    const api = createApi({ baseUrl: 'http://x', getToken: () => null, fetchImpl });
    await api.login('admin@gravirei.com', 'pw');
    expect(captured!.url).toBe('http://x/api/auth/login');
    expect(JSON.parse(captured!.init.body as string)).toEqual({
      username: 'admin',
      email: 'admin@gravirei.com',
      password: 'pw',
    });
  });

  it('login attaches Authorization header when token is set', async () => {
    let captured: RequestInit | null = null;
    const fetchImpl = (async (_url: string, init: RequestInit) => {
      captured = init;
      return new Response(JSON.stringify({ token: 't', user: {} }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }) as unknown as typeof fetch;
    const api = createApi({ baseUrl: 'http://x', getToken: () => 'tok', fetchImpl });
    await api.login('a@b.com', 'pw');
    const headers = captured!.headers as Record<string, string>;
    expect(headers.Authorization).toBe('Bearer tok');
  });

  it('throws ApiError on non-2xx with the reason', async () => {
    const fetchImpl = makeFetch([{ status: 400, body: { reason: 'bad input' } }]);
    const api = createApi({ baseUrl: 'http://x', getToken: () => null, fetchImpl });
    await expect(api.getJunctions()).rejects.toMatchObject({
      status: 400,
      message: 'bad input',
    });
  });

  it('falls back to error field when reason absent', async () => {
    const fetchImpl = makeFetch([{ status: 401, body: { error: 'no auth' } }]);
    const api = createApi({ baseUrl: 'http://x', getToken: () => null, fetchImpl });
    await expect(api.me()).rejects.toBeInstanceOf(ApiError);
  });

  it('command builds the right URL and sends body', async () => {
    let captured: { url: string; init: RequestInit } | null = null;
    const fetchImpl = (async (url: string, init: RequestInit) => {
      captured = { url, init };
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }) as unknown as typeof fetch;
    const api = createApi({ baseUrl: 'http://x', getToken: () => null, fetchImpl });
    await api.command('cross', 'preempt', { leg: 1 });
    expect(captured!.url).toBe('http://x/api/commands/cross/preempt');
    expect(JSON.parse(captured!.init.body as string)).toEqual({ leg: 1 });
  });
});
