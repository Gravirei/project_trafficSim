import cors from 'cors';
import { env } from '../config/env';

const allowedOrigins = env.CORS_ORIGIN.split(',').map((o) => o.trim());

export const corsMiddleware = cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, curl, health checks)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        return callback(new Error(`CORS: Origin ${origin} not allowed`));
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
    exposedHeaders: ['X-Request-Id'],
    credentials: true,
});
