/**
 * Typed REST client for the GREENWAVE backend.
 * Reads the JWT from a closure so callers don't have to thread it
 * through every call site. The base URL comes from NEXT_PUBLIC_API_URL.
 */
import type {
  ApiCommandResult,
  ApiEvent,
  ApiJunction,
  ApiLoginResponse,
  ApiSnapshot,
  ApiSparkPoint,
  ApiUser,
} from './types';

export class ApiError extends Error {
  public readonly status: number;
  public readonly body: unknown;
  constructor(status: number, message: string, body: unknown) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

export interface ApiClientOptions {
  baseUrl: string;
  getToken: () => string | null;
  fetchImpl?: typeof fetch;
}

export interface ApiClient {
  login(email: string, password: string): Promise<ApiLoginResponse>;
  me(): Promise<{ user: ApiUser }>;
  getJunctions(): Promise<ApiJunction[]>;
  getJunction(id: string): Promise<ApiJunction>;
  getSnapshot(id: string): Promise<ApiSnapshot>;
  getEvents(id: string, sinceMs?: number, limit?: number): Promise<ApiEvent[]>;
  getSpark(id: string, windowSec?: number): Promise<ApiSparkPoint[]>;
  getDrifts(id: string): Promise<unknown[]>;
  command(id: string, kind: string, body?: unknown): Promise<ApiCommandResult>;
  pushSnapshot(snapshot: ApiSnapshot): Promise<ApiCommandResult>;
}

function makeHeaders(token: string | null, hasBody: boolean): Record<string, string> {
  const h: Record<string, string> = {};
  if (hasBody) h['Content-Type'] = 'application/json';
  if (token) h['Authorization'] = `Bearer ${token}`;
  return h;
}

export function createApi(opts: ApiClientOptions): ApiClient {
  const { baseUrl, getToken, fetchImpl = fetch } = opts;

  async function call<T>(method: string, path: string, body?: unknown): Promise<T> {
    const url = `${baseUrl}${path}`;
    const res = await fetchImpl(url, {
      method,
      headers: makeHeaders(getToken(), body !== undefined),
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    const text = await res.text();
    const json = text ? JSON.parse(text) : undefined;
    if (!res.ok) {
      const msg =
        (json && typeof json === 'object' && 'error' in json && String(json.error)) ||
        (json && typeof json === 'object' && 'reason' in json && String(json.reason)) ||
        `${method} ${path} failed (${res.status})`;
      throw new ApiError(res.status, msg, json);
    }
    return json as T;
  }

  return {
    login: (email, password) => {
      // Backend login schema requires {username, email, password}; derive
      // username from the email local part so callers only need credentials.
      const username = email.split('@')[0];
      return call<ApiLoginResponse>('POST', '/api/auth/login', {
        username,
        email,
        password,
      });
    },
    me: () => call<{ user: ApiUser }>('GET', '/api/auth/me'),
    getJunctions: async () => {
      const res = await call<{ data: ApiJunction[] }>('GET', '/api/junctions');
      return res.data;
    },
    getJunction: async (id) => {
      const res = await call<{ data: ApiJunction }>('GET', `/api/junctions/${id}`);
      return res.data;
    },
    getSnapshot: async (id) => {
      const res = await call<{ data: ApiSnapshot }>('GET', `/api/junctions/${id}/snapshot`);
      return res.data;
    },
    getEvents: async (id, sinceMs = 0, limit = 70) => {
      const res = await call<{ data: ApiEvent[] }>(
        'GET',
        `/api/telemetry/junction/${id}/events?sinceMs=${sinceMs}&limit=${limit}`,
      );
      return res.data;
    },
    getSpark: async (id, _windowSec = 90) => {
      // Backend Phase 4 spark endpoint exists but uses phase log; the
      // client sim is authoritative for live sparkline. This call is
      // used for cold reload backfill (Phase 7).
      const res = await call<{ data: ApiSparkPoint[] }>(
        'GET',
        `/api/telemetry/junction/${id}/spark`,
      );
      return res.data;
    },
    getDrifts: async (id) => {
      const res = await call<{ data: unknown[] }>('GET', `/api/telemetry/junction/${id}/drifts`);
      return res.data;
    },
    command: (id, kind, body) =>
      call<ApiCommandResult>('POST', `/api/commands/${id}/${kind}`, body ?? {}),
    pushSnapshot: (snapshot) =>
      call<ApiCommandResult>('POST', `/api/commands/${snapshot.junctionId}/snapshot`, snapshot),
  };
}
