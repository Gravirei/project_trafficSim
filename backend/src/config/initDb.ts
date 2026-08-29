import { runMigrations } from './migrations';
import { logger } from './logger';

/**
 * Backwards-compatible startup hook. Delegates to the versioned migration
 * runner. Safe to call on every server start; pending migrations are applied
 * and previously-applied ones are skipped.
 */
export async function ensureDatabaseReady(): Promise<void> {
  const { applied, skipped } = await runMigrations();
  if (applied.length === 0) {
    logger.debug({ skipped }, 'Database is up to date; no migrations applied');
  } else {
    logger.info({ applied, skipped }, 'Database migrations finished');
  }
}
