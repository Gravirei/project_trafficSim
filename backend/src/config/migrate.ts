import { runMigrations } from './migrations';
import { logger } from './logger';
import pool from './db';

async function migrate(): Promise<void> {
  const { applied, skipped } = await runMigrations();
  if (applied.length === 0) {
    logger.info({ skipped }, 'No pending migrations; database is up to date');
  } else {
    logger.info({ applied, skipped }, 'Migration completed');
  }
}

void migrate()
  .catch((err) => {
    logger.error({ err }, 'Migration failed');
    process.exit(1);
  })
  .finally(() => {
    void pool.end();
  });
