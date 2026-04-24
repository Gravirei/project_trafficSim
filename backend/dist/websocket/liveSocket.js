"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeWebSocket = initializeWebSocket;
exports.getIO = getIO;
const socket_io_1 = require("socket.io");
const simulationEngine_1 = require("../engine/simulationEngine");
let io;
/**
 * Initialize Socket.io and wire up tick events from the simulation engine
 */
function initializeWebSocket(httpServer, corsOrigin) {
    io = new socket_io_1.Server(httpServer, {
        cors: {
            origin: corsOrigin,
            methods: ['GET', 'POST'],
        },
    });
    // Wire simulation engine ticks to WebSocket broadcasts
    simulationEngine_1.simulationEngine.setOnTick((data) => {
        io.emit('tick-update', data);
    });
    io.on('connection', (socket) => {
        console.log(`🔌 Client connected: ${socket.id}`);
        // Send current simulation status on connect
        socket.emit('simulation-status', simulationEngine_1.simulationEngine.getStatus());
        socket.on('disconnect', () => {
            console.log(`🔌 Client disconnected: ${socket.id}`);
        });
    });
    console.log('🌐 WebSocket server initialized');
    return io;
}
function getIO() {
    return io;
}
//# sourceMappingURL=liveSocket.js.map