"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = __importDefault(require("http"));
const app_1 = __importDefault(require("./app"));
const liveSocket_1 = require("./websocket/liveSocket");
const db_1 = __importDefault(require("./config/db"));
const initDb_1 = require("./config/initDb");
const PORT = Number(process.env.PORT) || 3001;
// Create HTTP server from Express app
const server = http_1.default.createServer(app_1.default);
// Initialize WebSocket
const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:3000';
(0, liveSocket_1.initializeWebSocket)(server, corsOrigin);
// Test DB connection and start server
async function start() {
    try {
        // Test database connection
        const result = await db_1.default.query('SELECT NOW()');
        console.log('✅ Database connected at:', result.rows[0].now);
        await (0, initDb_1.ensureDatabaseReady)();
        server.listen(PORT, () => {
            console.log(`\n🚦 Traffic Signal Simulation Server`);
            console.log(`   REST API:   http://localhost:${PORT}/api`);
            console.log(`   WebSocket:  ws://localhost:${PORT}`);
            console.log(`   Health:     http://localhost:${PORT}/api/health\n`);
        });
    }
    catch (err) {
        console.error('❌ Failed to start server:', err.message);
        process.exit(1);
    }
}
start();
//# sourceMappingURL=server.js.map