import { describe, it, expect, beforeEach } from 'vitest';
import { TOKEN_KEY, USER_KEY, loadSession, saveSession, clearSession, hasStoredSession } from '../session';

const user = { id: 1, username: 'admin', email: 'admin@gravirei.com', role: 'ADMIN' } as never;

describe('auth session persistence', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns empty session when nothing stored', () => {
    expect(loadSession()).toEqual({ token: null, user: null });
    expect(hasStoredSession()).toBe(false);
  });

  it('saves and restores token + user across reads', () => {
    saveSession('jwt-token-abc', user);
    expect(localStorage.getItem(TOKEN_KEY)).toBe('jwt-token-abc');
    const session = loadSession();
    expect(session.token).toBe('jwt-token-abc');
    expect(session.user).toMatchObject({ username: 'admin' });
    expect(hasStoredSession()).toBe(true);
  });

  it('clearSession removes both keys', () => {
    saveSession('jwt-token-abc', user);
    clearSession();
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
    expect(localStorage.getItem(USER_KEY)).toBeNull();
    expect(loadSession()).toEqual({ token: null, user: null });
  });

  it('survives corrupt user JSON without throwing', () => {
    localStorage.setItem(TOKEN_KEY, 'jwt');
    localStorage.setItem(USER_KEY, '{not-json');
    expect(loadSession()).toEqual({ token: null, user: null });
  });
});
