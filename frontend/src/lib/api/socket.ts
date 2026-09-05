/**
 * Thin Socket.IO wrapper. The backend's liveSocket broadcasts tick
 * updates; the audit runner (Phase 3) does not yet push socket events,
 * so this wrapper currently only manages the connection lifecycle.
 * Phase 6 will wire snapshot/event/drift listeners once the backend
 * side starts emitting them.
 */
import { io, Socket } from 'socket.io-client';

export type SocketStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting';

export interface SocketClient {
  /** Returns a stable handle to the underlying socket. May be null until connected. */
  socket(): Socket | null;
  status(): SocketStatus;
  on(event: string, handler: (...args: unknown[]) => void): () => void;
  connect(): void;
  disconnect(): void;
}

export interface SocketClientOptions {
  baseUrl: string;
  getToken: () => string | null;
}

export function createSocket(opts: SocketClientOptions): SocketClient {
  let s: Socket | null = null;
  let currentStatus: SocketStatus = 'disconnected';
  const listeners = new Set<(s: SocketStatus) => void>();

  function setStatus(next: SocketStatus): void {
    if (next === currentStatus) return;
    currentStatus = next;
    for (const fn of listeners) fn(next);
  }

  function attach(): Socket {
    const token = opts.getToken();
    s = io(opts.baseUrl, {
      autoConnect: false,
      transports: ['websocket', 'polling'],
      auth: token ? { token } : undefined,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });
    s.on('connect', () => setStatus('connected'));
    s.on('disconnect', () => setStatus('disconnected'));
    s.on('reconnect_attempt', () => setStatus('reconnecting'));
    s.on('connect_error', () => setStatus('disconnected'));
    return s;
  }

  return {
    socket: () => s,
    status: () => currentStatus,
    on(event, handler) {
      if (!s) s = attach();
      // socket.io-client types are loose; we treat handlers as opaque.
      s.on(event, handler as (...args: unknown[]) => void);
      return () => s?.off(event, handler as (...args: unknown[]) => void);
    },
    connect() {
      if (!s) s = attach();
      setStatus('connecting');
      s.connect();
    },
    disconnect() {
      s?.disconnect();
      setStatus('disconnected');
    },
  };
}
