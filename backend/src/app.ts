import express from 'express';
import helmet from 'helmet';
import compression from 'compression';
import pinoHttp from 'pino-http';

import { corsMiddleware } from './middleware/cors';
import { requestId } from './middleware/requestId';
import { generalRateLimiter } from './middleware/rateLimit';
import { authenticate } from './middleware/auth';
import authRoutes from './routes/auth.routes';
import signalRoutes from './routes/signals.routes';
import simulationRoutes from './routes/simulation.routes';
import historyRoutes from './routes/history.routes';
import analyticsRoutes from './routes/analytics.routes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { logger } from './config/logger';
import pool from './config/db';

const app = express();

// Security & observability
app.use(helmet());
app.use(requestId);
app.use(compression());
app.use(
  pinoHttp({
    logger,
    customProps: (req) => ({ requestId: (req as any).requestId }),
    autoLogging: true,
  })
);
app.use(corsMiddleware);
app.use(express.json({ limit: '100kb' }));
app.use(generalRateLimiter);

// Health checks (public, no auth)
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), uptime: process.uptime() });
});

app.get('/api/ready', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ready', timestamp: new Date().toISOString() });
  } catch {
    res.status(503).json({ status: 'not_ready', timestamp: new Date().toISOString() });
  }
});

// Auth Routes (Public)
app.use('/api/auth', authRoutes);

// Protected Routes (Authenticate all)
app.use('/api/signals', authenticate, signalRoutes);
app.use('/api/simulation', authenticate, simulationRoutes);
app.use('/api/history', authenticate, historyRoutes);
app.use('/api/analytics', authenticate, analyticsRoutes);

// 404 + Global error handler
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
