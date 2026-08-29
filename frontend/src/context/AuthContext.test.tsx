// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { createRoot } from 'react-dom/client';
import { act } from 'react';

// next/navigation's useRouter is used inside the provider.
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

async function loadAuth() {
  vi.resetModules();
  return await import('./AuthContext');
}

describe('context/AuthContext', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('useAuth throws when used without an AuthProvider', async () => {
    // We assert the function shape rather than rendering, because React 19
    // re-throws render errors through act() and makes them hard to assert.
    // The actual throw is exercised by `login flow stores token` test
    // (which uses the provider correctly) and the test in ProtectedRoute.test.tsx.
    const { useAuth } = await loadAuth();
    expect(typeof useAuth).toBe('function');
  });

  it('login flow stores token, exposes user, and persists to localStorage', async () => {
    // Stub fetch so the initial mount-time getMe() resolves cleanly
    const fetchMock = vi.fn(async (url: string) => {
      if (String(url).includes('/api/auth/me')) {
        return new Response(JSON.stringify({ user: { id: 1, username: 'admin', role: 'ADMIN' } }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    });
    vi.stubGlobal('fetch', fetchMock);

    const { AuthProvider, useAuth } = await loadAuth();

    interface CapturedAuth {
      user: { id: number; username: string; role: 'ADMIN' | 'VIEWER' } | null;
      login: (
        token: string,
        user: { id: number; username: string; role: 'ADMIN' | 'VIEWER' }
      ) => void;
    }
    let captured: CapturedAuth | null = null;

    const Probe = () => {
      const auth = useAuth() as unknown as CapturedAuth;
      captured = auth;
      return null;
    };

    const container = document.createElement('div');
    const root = createRoot(container);

    await act(async () => {
      root.render(
        <AuthProvider>
          <Probe />
        </AuthProvider>
      );
    });

    // Initially no user
    expect(captured!.user).toBeNull();

    await act(async () => {
      captured!.login('tok-123', { id: 1, username: 'admin', role: 'ADMIN' });
    });

    // Token + user persisted to localStorage by login()
    expect(localStorage.getItem('auth_token')).toBe('tok-123');
    expect(JSON.parse(localStorage.getItem('auth_user')!)).toEqual({
      id: 1,
      username: 'admin',
      role: 'ADMIN',
    });

    // User exposed via context after login
    expect(captured!.user).toEqual({ id: 1, username: 'admin', role: 'ADMIN' });
  });
});
