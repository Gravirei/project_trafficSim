import { readdir, readFile } from 'fs/promises';
import path from 'path';
import bcrypt from 'bcryptjs';
import type { PoolClient } from 'pg';
import pool from './db';
import { logger } from './logger';

const MIGRATIONS_TABLE_DDL = `
  CREATE TABLE IF NOT EXISTS migrations (
    id         SERIAL PRIMARY KEY,
    name       TEXT NOT NULL UNIQUE,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )
`;

const migrationsDir = path.resolve(__dirname, '../../database/migrations');

const ADMIN_USERNAME = 'admin';
const DEFAULT_ADMIN_PASSWORD = 'Admin@123!';

function isMigrationFile(name: string): boolean {
  return /^V\d+__.*\.sql$/i.test(name);
}

function isSeedFile(name: string): boolean {
  return /seed/i.test(name);
}

async function ensureMigrationsTable(client: PoolClient): Promise<void> {
  await client.query(MIGRATIONS_TABLE_DDL);
}

async function getAppliedMigrations(client: PoolClient): Promise<Set<string>> {
  const result = await client.query<{ name: string }>('SELECT name FROM migrations');
  return new Set(result.rows.map((row) => row.name));
}

async function listMigrationFiles(): Promise<string[]> {
  const entries = await readdir(migrationsDir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && isMigrationFile(entry.name))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b));
}

async function applySeedAdminPassword(client: PoolClient): Promise<void> {
  const password = process.env.ADMIN_PASSWORD || DEFAULT_ADMIN_PASSWORD;
  const hash = await bcrypt.hash(password, 10);
  const result = await client.query(
    `UPDATE users
        SET password_hash = $1
      WHERE username = $2`,
    [hash, ADMIN_USERNAME]
  );
  if (result.rowCount && result.rowCount > 0) {
    logger.info(
      { username: ADMIN_USERNAME },
      'Updated default admin password from ADMIN_PASSWORD env'
    );
  }
}

/**
 * Apply any pending migrations in order. Idempotent: re-running on a fully
 * migrated database is a no-op.
 */
export async function runMigrations(): Promise<{ applied: string[]; skipped: number }> {
  const client = await pool.connect();
  const applied: string[] = [];

  try {
    await ensureMigrationsTable(client);
    const alreadyApplied = await getAppliedMigrations(client);
    const files = await listMigrationFiles();

    for (const fileName of files) {
      if (alreadyApplied.has(fileName)) {
        continue;
      }

      const filePath = path.join(migrationsDir, fileName);
      const sql = await readFile(filePath, 'utf8');

      logger.info({ migration: fileName }, 'Applying migration');
      await client.query('BEGIN');
      try {
        await client.query(sql);

        // Post-process seed files: replace admin password placeholder with
        // a real bcrypt hash derived from ADMIN_PASSWORD (default: Admin@123!).
        if (isSeedFile(fileName)) {
          await applySeedAdminPassword(client);
        }

        await client.query('INSERT INTO migrations (name) VALUES ($1)', [fileName]);
        await client.query('COMMIT');
        applied.push(fileName);
        logger.info({ migration: fileName }, 'Migration applied');
      } catch (err) {
        await client.query('ROLLBACK');
        logger.error({ err, migration: fileName }, 'Migration failed; rolled back');
        throw err;
      }
    }

    return { applied, skipped: files.length - applied.length };
  } finally {
    client.release();
  }
}
