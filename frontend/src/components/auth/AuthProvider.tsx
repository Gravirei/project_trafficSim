'use client';

/**
 * AuthProvider + BackendProvider combined.
 *
 * - Holds the JWT in localStorage under 'gw_jwt'
 * - Exposes { user, token, login, logout, api, socket, status }
 * - On mount, validates the stored token via /api/auth/me
 * - Reconnects the socket whenever the token changes
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
import { useRouter } from 'next/navigation';
import { createApi, ApiClient } from '@/lib/api/client';
import { createSocket, SocketClient, SocketStatus } from '@/lib/api/socket';
import type { ApiUser } from '@/lib/api/types';

const TOKEN_KEY = 'gw_jwt';
const USER_KEY = 'gw_user';
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<ApiUser | null>(null);
  const [status, setStatus] = useState<AuthContextValue['status']>('idle');
  const [socketStatus, setSocketStatus] = useState<SocketStatus>('disconnected');

  // tokenRef lets the api/socket clients read the latest token without
  // recreating them on every state change.
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

  // Poll the socket status (the SocketClient interface does not yet
  // expose a status subscription; the polling interval is the workaround
  // until Phase 6 wires the real status stream).
  useEffect(() => {
    const interval = setInterval(() => {
      const next = socket.status();
      setSocketStatus((prev) => (prev === next ? prev : next));
    }, 500);
    return () => clearInterval(interval);
  }, [socket]);

  // Hydrate from localStorage and validate.
  useEffect(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;
    if (!stored) {
      setStatus('unauthenticated');
      return;
    }
    setToken(stored);
    setStatus('loading');
    api
      .me()
      .then(({ user }) => {
        setUser(user);
        setStatus('authenticated');
        localStorage.setItem(USER_KEY, JSON.stringify(user));
        socket.connect();
      })
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        setToken(null);
        setUser(null);
        setStatus('unauthenticated');
      });
  }, [api, socket]);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await api.login(email, password);
      localStorage.setItem(TOKEN_KEY, res.token);
      localStorage.setItem(USER_KEY, JSON.stringify(res.user));
      tokenRef.current = res.token;
      setToken(res.token);
      setUser(res.user);
      setStatus('authenticated');
      socket.connect();
    },
    [api, socket],
  );

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
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
