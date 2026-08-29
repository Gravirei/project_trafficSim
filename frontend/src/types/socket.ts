import type { SignalTick, SimulationStatus } from './index';

/**
 * Strongly-typed Socket.io event contracts.
 *
 * Reuse these with the `socket.io-client` generic parameters so handlers and
 * emitters are type-checked end-to-end:
 *
 *   import { io, Socket } from 'socket.io-client';
 *   import type { ServerToClientEvents, ClientToServerEvents } from '@/types/socket';
 *
 *   const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(url);
 *   socket.on('tick-update', (data) => data.signals); // data is fully typed
 *
 * The shape of the `tick-update` payload mirrors the backend
 * `TickData` interface (`backend/src/engine/simulationEngine.ts`).
 */

export interface ServerToClientEvents {
  /**
   * Emitted on every simulation tick (throttled to ~4 Hz on the server).
   * Mirrors `TickData` from the backend engine.
   */
  'tick-update': (data: {
    tick: number;
    signals: SignalTick[];
    mode: 'MANUAL' | 'ADAPTIVE';
    adaptiveAction?: string | null;
  }) => void;

  /**
   * Emitted to a freshly connected client with the current simulation status.
   */
  'simulation-status': (status: SimulationStatus) => void;

  /**
   * Generic server-side error notification (e.g. capacity exceeded,
   * invalid payload).
   */
  error: (payload: { message: string }) => void;
}

/**
 * Reserved for future client-initiated events (e.g. manual signal override,
 * subscribe-to-signal). Intentionally empty for now — using a type alias
 * instead of an empty `interface` keeps the linter happy and means we can
 * add members without changing call sites.
 */
export type ClientToServerEvents = Record<string, never>;

/**
 * Per-socket data attached by the backend's auth middleware
 * (`backend/src/websocket/liveSocket.ts`). Anything attached to
 * `socket.data` on the server should be reflected here.
 */
export interface SocketData {
  user: { id: number; username: string; role: string };
}
