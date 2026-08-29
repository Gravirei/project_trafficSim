// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

const disconnectMock = vi.fn();
const connectMock = vi.fn();

const fakeSocket = {
  disconnected: true,
  auth: undefined as Record<string, unknown> | undefined,
  disconnect: disconnectMock,
  connect: connectMock,
};

vi.mock('socket.io-client', () => ({
  io: vi.fn(() => fakeSocket),
}));

async function loadSocketService() {
  vi.resetModules();
  return await import('./socket');
}

describe('lib/socket', () => {
  beforeEach(() => {
    localStorage.clear();
    disconnectMock.mockClear();
    connectMock.mockClear();
    fakeSocket.disconnected = true;
    fakeSocket.auth = undefined;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('connect() creates a socket using the token from api/auth storage', async () => {
    // Use localStorage (set BEFORE socket module loads) to pass the token
    // through, since vi.resetModules() would otherwise isolate the api
    // module instance used by socketService from the one we setToken on.
    localStorage.setItem('auth_token', 'socket-token-xyz');
    const { socketService } = await loadSocketService();
    const { io } = await import('socket.io-client');

    socketService.connect();

    expect(io).toHaveBeenCalledTimes(1);
    const opts = (io as unknown as ReturnType<typeof vi.fn>).mock.calls[0][1];
    expect((opts as { auth: { token: string } }).auth.token).toBe('socket-token-xyz');
  });

  it('disconnect() disconnects the underlying socket and nulls the instance', async () => {
    const { socketService } = await loadSocketService();

    // First call connect to create the socket
    socketService.connect();
    expect(socketService.instance).not.toBeNull();

    socketService.disconnect();

    expect(disconnectMock).toHaveBeenCalledTimes(1);
    expect(socketService.instance).toBeNull();
  });
});
