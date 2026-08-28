import { Pool } from 'pg';
import { env } from './env';
import { logger } from './logger';

const pool = new Pool({
    host: env.DB_HOST,
    port: env.DB_PORT,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
});

pool.on('connect', () => {
    logger.info('Connected to PostgreSQL');
});

pool.on('error', (err) => {
    logger.error({ err }, 'PostgreSQL pool error');
});

export default pool;
