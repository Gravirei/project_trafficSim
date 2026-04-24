import { Server as HttpServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import { simulationEngine, TickData } from '../engine/simulationEngine';

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
            const jwt = require('jsonwebtoken');
            const JWT_SECRET = process.env.JWT_SECRET || 'secret_key_for_dev_only';
            const decoded = jwt.verify(token, JWT_SECRET);
            socket.data.user = decoded;
            next();
        } catch (err) {
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

        console.log(`🔌 Client connected: ${socket.id}`);

        // Send current simulation status on connect
        socket.emit('simulation-status', simulationEngine.getStatus());

        socket.on('disconnect', () => {
            console.log(`🔌 Client disconnected: ${socket.id}`);
        });
    });

    console.log('🌐 WebSocket server initialized');

    return io;
}

export function getIO(): SocketServer {
    return io;
}
