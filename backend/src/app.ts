import express from 'express';
import dotenv from 'dotenv';

import { corsMiddleware } from './middleware/cors';
import { authenticate } from './middleware/auth';
import authRoutes from './routes/auth.routes';
import signalRoutes from './routes/signals.routes';
import simulationRoutes from './routes/simulation.routes';
import historyRoutes from './routes/history.routes';
import analyticsRoutes from './routes/analytics.routes';
import { errorHandler } from './middleware/errorHandler';

dotenv.config();

const app = express();

// Middleware
app.use(corsMiddleware);
app.use(express.json());

// Health check
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Auth Routes (Public)
app.use('/api/auth', authRoutes);

// Protected Routes (Authenticate all)
app.use('/api/signals', authenticate, signalRoutes);
app.use('/api/simulation', authenticate, simulationRoutes);
app.use('/api/history', authenticate, historyRoutes);
app.use('/api/analytics', authenticate, analyticsRoutes);

// Global error handler
app.use(errorHandler);

export default app;
