import type { ApiUser } from '@/lib/api/types';

export const TOKEN_KEY = 'gw_jwt';
export const USER_KEY = 'gw_user';

export interface StoredSession {
  token: string | null;
  user: ApiUser | null;
}

function safeStorage(): Storage | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function loadSession(): StoredSession {
  const storage = safeStorage();
  if (!storage) return { token: null, user: null };
  try {
    const token = storage.getItem(TOKEN_KEY);
    const rawUser = storage.getItem(USER_KEY);
    const user: ApiUser | null = rawUser ? (JSON.parse(rawUser) as ApiUser) : null;
    return { token: token || null, user };
  } catch {
    return { token: null, user: null };
  }
}

export function saveSession(token: string, user: ApiUser): void {
  const storage = safeStorage();
  if (!storage) return;
  try {
    storage.setItem(TOKEN_KEY, token);
    storage.setItem(USER_KEY, JSON.stringify(user));
  } catch {
    /* private mode / quota */
  }
}

export function clearSession(): void {
  const storage = safeStorage();
  if (!storage) return;
  try {
    storage.removeItem(TOKEN_KEY);
    storage.removeItem(USER_KEY);
  } catch {
    /* ignore */
  }
}

export function hasStoredSession(): boolean {
  return Boolean(loadSession().token);
}
