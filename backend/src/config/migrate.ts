import { readFile } from 'fs/promises';
import path from 'path';
import pool from './db';
import { logger } from './logger';

const migrationsDir = path.resolve(__dirname, '../../database');

async function migrate(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query(await readFile(path.join(migrationsDir, 'schema.sql'), 'utf8'));
    const count = await client.query('SELECT COUNT(*)::int as c FROM signals');
    if (count.rows[0].c === 0) {
      await client.query(await readFile(path.join(migrationsDir, 'seed.sql'), 'utf8'));
      logger.info('Seeded default signals');
    }
    logger.info('Migration completed');
  } finally {
    client.release();
    await pool.end();
  }
}

void migrate().catch((err) => {
  logger.error({ err }, 'Migration failed');
  process.exit(1);
});
