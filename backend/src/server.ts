import http from 'http';
import app from './app';
import { initializeWebSocket } from './websocket/liveSocket';
import pool from './config/db';
import { ensureDatabaseReady } from './config/initDb';
import { VehicleLogModel } from './models/vehicleLog.model';
import { QueueHistoryModel } from './models/queueHistory.model';
import { env } from './config/env';
import { logger } from './config/logger';
import { simulationEngine } from './engine/simulationEngine';
import { auditRunner } from './engine/auditRunner';

const PORT = env.PORT;

// Create HTTP server from Express app
const server = http.createServer(app);

// Initialize WebSocket
initializeWebSocket(server, env.CORS_ORIGIN);

// Test DB connection and start server
async function start(): Promise<void> {
  try {
    const result = await pool.query('SELECT NOW()');
    logger.info({ time: result.rows[0].now }, 'Database connected');
    await ensureDatabaseReady();

    // Phase 3: start the audit runner alongside the legacy engine. The
    // legacy engine remains for one release; it will be removed in Phase 8.
    await auditRunner.initialize();
    auditRunner.start();

    server.listen(PORT, () => {
      logger.info(`Traffic Signal Simulation Server listening on port ${PORT}`);
      logger.info(`REST API:   http://localhost:${PORT}/api`);
      logger.info(`WebSocket:  ws://localhost:${PORT}`);
      logger.info(`Health:     http://localhost:${PORT}/api/health`);
    });

    // Retention cleanup: delete rows older than 24 hours, runs every hour
    const RETENTION_HOURS = 24;
    const retentionInterval = setInterval(
      async () => {
        try {
          const v = await VehicleLogModel.purgeOlderThan(RETENTION_HOURS);
          const q = await QueueHistoryModel.purgeOlderThan(RETENTION_HOURS);
          logger.info({ v, q }, 'Retention cleanup completed');
        } catch (err: unknown) {
          logger.error({ err }, 'Retention cleanup error');
        }
      },
      60 * 60 * 1000
    );

    // Graceful shutdown
    const shutdown = async (signal: string): Promise<void> => {
      logger.info({ signal }, 'Shutting down gracefully');
      clearInterval(retentionInterval);
      simulationEngine.stop();
      auditRunner.stop();
      server.close(async () => {
        try {
          await pool.end();
          logger.info('Database pool closed');
        } catch (e) {
          logger.error({ e }, 'Error closing pool');
        }
        process.exit(0);
      });
      // Force exit after 10s if not closed
      setTimeout(() => {
        logger.warn('Forced shutdown after timeout');
        process.exit(1);
      }, 10_000).unref();
    };

    process.on('SIGTERM', () => void shutdown('SIGTERM'));
    process.on('SIGINT', () => void shutdown('SIGINT'));
    process.on('unhandledRejection', (reason) => {
      logger.error({ reason }, 'Unhandled Rejection');
    });
    process.on('uncaughtException', (err) => {
      logger.fatal({ err }, 'Uncaught Exception');
      process.exit(1);
    });
  } catch (err: unknown) {
    logger.fatal({ err }, 'Failed to start server');
    process.exit(1);
  }
}

void start();
