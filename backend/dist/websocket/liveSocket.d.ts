import { Server as HttpServer } from 'http';
import { Server as SocketServer } from 'socket.io';
/**
 * Initialize Socket.io and wire up tick events from the simulation engine
 */
export declare function initializeWebSocket(httpServer: HttpServer, corsOrigin: string): SocketServer;
export declare function getIO(): SocketServer;
//# sourceMappingURL=liveSocket.d.ts.map