import { Server as HttpServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import jwt from 'jsonwebtoken';
import { simulationEngine, TickData } from '../engine/simulationEngine';
import { env } from '../config/env';
import { logger } from '../config/logger';

const MAX_WS_CLIENTS = 50;
let lastEmitTime = 0;
let io: SocketServer;

/**
 * Initialize Socket.io and wire up tick events from the simulation engine
 */
export function initializeWebSocket(httpServer: HttpServer, corsOrigin: string): SocketServer {
  io = new SocketServer(httpServer, {
    cors: {
      origin: corsOrigin,
      methods: ['GET', 'POST'],
    },
  });

  // Authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error('Authentication error: Token required'));
    }
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET);
      socket.data.user = decoded;
      next();
    } catch {
      next(new Error('Authentication error: Invalid or expired token'));
    }
  });

  // Wire simulation engine ticks to WebSocket broadcasts (throttled to max 4/sec)
  simulationEngine.setOnTick((data: TickData) => {
    const now = Date.now();
    if (now - lastEmitTime >= 250) {
      lastEmitTime = now;
      io.emit('tick-update', data);
    }
  });

  io.on('connection', (socket) => {
    if (io.sockets.sockets.size > MAX_WS_CLIENTS) {
      socket.emit('error', { message: 'Server at capacity' });
      socket.disconnect(true);
      return;
    }

    logger.info({ socketId: socket.id }, 'Client connected');

    // Send current simulation status on connect
    socket.emit('simulation-status', simulationEngine.getStatus());

    socket.on('disconnect', () => {
      logger.info({ socketId: socket.id }, 'Client disconnected');
    });
  });

  logger.info('WebSocket server initialized');

  return io;
}

export function getIO(): SocketServer {
  return io;
}
