'use client';

/**
 * AuthProvider + BackendProvider combined.
 *
 * Session persistence:
 * - JWT + cached user live in localStorage (gw_jwt / gw_user)
 * - On mount/refresh, restore the session immediately, then revalidate
 *   against /api/auth/me
 * - Only a definitive 401/403 clears the stored session — network blips
 *   keep you logged in
 */
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createApi, ApiClient, ApiError } from '@/lib/api/client';
import { createSocket, SocketClient, SocketStatus } from '@/lib/api/socket';
import { clearSession, loadSession, saveSession } from '@/lib/auth/session';
import type { ApiUser } from '@/lib/api/types';

// Local backend uses :3002 because :3001 is occupied by MiMo Desktop host.
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3002';
const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? API_URL;

export interface AuthContextValue {
  user: ApiUser | null;
  token: string | null;
  status: 'idle' | 'loading' | 'authenticated' | 'unauthenticated';
  api: ApiClient;
  socket: SocketClient;
  socketStatus: SocketStatus;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function isAuthRejection(err: unknown): boolean {
  if (err instanceof ApiError) return err.status === 401 || err.status === 403;
  return false;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<ApiUser | null>(null);
  const [status, setStatus] = useState<AuthContextValue['status']>('idle');
  const [socketStatus, setSocketStatus] = useState<SocketStatus>('disconnected');

  // Ref mirrors token immediately so api/socket never race React state.
  const tokenRef = useRef<string | null>(null);
  useEffect(() => {
    tokenRef.current = token;
  }, [token]);

  const api = useMemo<ApiClient>(
    () => createApi({ baseUrl: API_URL, getToken: () => tokenRef.current }),
    [],
  );

  const socket = useMemo<SocketClient>(
    () => createSocket({ baseUrl: WS_URL, getToken: () => tokenRef.current }),
    [],
  );

  useEffect(() => {
    const interval = setInterval(() => {
      const next = socket.status();
      setSocketStatus((prev) => (prev === next ? prev : next));
    }, 500);
    return () => clearInterval(interval);
  }, [socket]);

  // Restore persisted session on mount/refresh, then revalidate.
  useEffect(() => {
    const session = loadSession();
    const storedToken = session.token;

    if (!storedToken) {
      tokenRef.current = null;
      setToken(null);
      setUser(null);
      setStatus('unauthenticated');
      return;
    }

    // Restore immediately so a refresh does not bounce to /login.
    tokenRef.current = storedToken;
    setToken(storedToken);
    setUser(session.user);
    setStatus(session.user ? 'authenticated' : 'loading');
    if (session.user) socket.connect();

    let cancelled = false;
    api
      .me()
      .then(({ user: fresh }) => {
        if (cancelled) return;
        tokenRef.current = storedToken;
        setToken(storedToken);
        setUser(fresh);
        setStatus('authenticated');
        saveSession(storedToken, fresh);
        socket.connect();
      })
      .catch((err) => {
        if (cancelled) return;
        // Keep the session on network/server errors; drop only on auth rejection.
        if (!isAuthRejection(err)) {
          setStatus('authenticated');
          return;
        }
        clearSession();
        tokenRef.current = null;
        setToken(null);
        setUser(null);
        setStatus('unauthenticated');
      });

    return () => {
      cancelled = true;
    };
  }, [api, socket]);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await api.login(email, password);
      saveSession(res.token, res.user);
      tokenRef.current = res.token;
      setToken(res.token);
      setUser(res.user);
      setStatus('authenticated');
      socket.connect();
    },
    [api, socket],
  );

  const logout = useCallback(() => {
    clearSession();
    tokenRef.current = null;
    setToken(null);
    setUser(null);
    setStatus('unauthenticated');
    socket.disconnect();
  }, [socket]);

  const value = useMemo<AuthContextValue>(
    () => ({ user, token, status, api, socket, socketStatus, login, logout }),
    [user, token, status, api, socket, socketStatus, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
