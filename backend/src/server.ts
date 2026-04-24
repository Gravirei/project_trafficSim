import http from 'http';
import app from './app';
import { initializeWebSocket } from './websocket/liveSocket';
import pool from './config/db';
import { ensureDatabaseReady } from './config/initDb';
import { VehicleLogModel } from './models/vehicleLog.model';
import { QueueHistoryModel } from './models/queueHistory.model';

const PORT = Number(process.env.PORT) || 3001;

// Create HTTP server from Express app
const server = http.createServer(app);

// Initialize WebSocket
const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:3000';
initializeWebSocket(server, corsOrigin);

// Test DB connection and start server
async function start() {
    try {
        // Test database connection
        const result = await pool.query('SELECT NOW()');
        console.log('✅ Database connected at:', result.rows[0].now);
        await ensureDatabaseReady();

        server.listen(PORT, () => {
            console.log(`\n🚦 Traffic Signal Simulation Server`);
            console.log(`   REST API:   http://localhost:${PORT}/api`);
            console.log(`   WebSocket:  ws://localhost:${PORT}`);
            console.log(`   Health:     http://localhost:${PORT}/api/health\n`);
        });

        // Retention cleanup: delete rows older than 24 hours, runs every hour
        const RETENTION_HOURS = 24;
        setInterval(async () => {
            try {
                const v = await VehicleLogModel.purgeOlderThan(RETENTION_HOURS);
                const q = await QueueHistoryModel.purgeOlderThan(RETENTION_HOURS);
                console.log(`🧹 Retention cleanup: removed ${v} vehicle_log rows, ${q} queue_history rows`);
            } catch (err: any) {
                console.error('Retention cleanup error:', err.message);
            }
        }, 60 * 60 * 1000);
    } catch (err: any) {
        console.error('❌ Failed to start server:', err.message);
        process.exit(1);
    }
}

start();
