import { io, Socket } from 'socket.io-client';
import { api } from './api';
import type { ServerToClientEvents, ClientToServerEvents } from '@/types/socket';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001';

// Strongly-typed socket alias. `socket.io-client@4.8.x` exposes
// `Socket<ListenEvents, EmitEvents>` with only two type parameters. The
// per-socket `SocketData` shape is documented in `types/socket.ts` and is
// exported from there for consumers that need it.
export type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

class SocketService {
  private socket: AppSocket | null = null;

  public connect(): AppSocket {
    const token =
      api.getToken() || (typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null);
    if (!this.socket) {
      // The runtime `io` call returns a `Socket<...>` whose generic
      // parameters default to `Record<string, any>`; we cast through
      // `unknown` so the assignment to `AppSocket` is safe without
      // re-implementing the constructor.
      this.socket = io(WS_URL, {
        auth: { token },
      }) as unknown as AppSocket;
    } else if (this.socket.disconnected) {
      this.socket.auth = { token };
      this.socket.connect();
    }
    return this.socket;
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  public get instance(): AppSocket | null {
    return this.socket;
  }
}

export const socketService = new SocketService();
