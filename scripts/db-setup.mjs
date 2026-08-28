#!/usr/bin/env node
/**
 * Cross-platform DB setup — works on Windows, macOS, Linux
 * Reads database/schema.sql and database/seed.sql and executes via pg.
 * No dependency on `psql` CLI or Unix shell `PGPASSWORD=` syntax.
 *
 * Usage:
 *   node scripts/db-setup.mjs        # runs schema + seed idempotently
 *   node scripts/db-setup.mjs --schema-only
 *   node scripts/db-setup.mjs --seed-only
 */
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import pg from 'pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const backendEnv = path.join(root, 'backend', '.env');

// Load env: backend/.env > root .env > process.env
dotenv.config({ path: backendEnv });
dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  user: process.env.DB_USER || 'admin',
  password: process.env.DB_PASSWORD || 'admin',
  database: process.env.DB_NAME || 'mydb',
});

async function runSqlFile(filePath) {
  const sql = await readFile(filePath, 'utf8');
  // Strip empty statements; pg can handle multiple statements in one query
  if (!sql.trim()) return;
  await pool.query(sql);
}

async function main() {
  const args = process.argv.slice(2);
  const schemaOnly = args.includes('--schema-only');
  const seedOnly = args.includes('--seed-only');

  const schemaPath = path.join(root, 'backend', 'database', 'schema.sql');
  const seedPath = path.join(root, 'backend', 'database', 'seed.sql');

  try {
    if (!seedOnly) {
      console.log(`→ Running schema: ${path.relative(root, schemaPath)}`);
      await runSqlFile(schemaPath);
      console.log('✓ Schema applied');
    }
    if (!schemaOnly) {
      try {
        const count = await pool.query('SELECT COUNT(*)::int as c FROM signals');
        if (count.rows[0].c === 0) {
          console.log(`→ Seeding: ${path.relative(root, seedPath)}`);
          await runSqlFile(seedPath);
          console.log('✓ Seed applied');
        } else {
          console.log('→ Seed skipped (signals already present)');
        }
      } catch {
        // signals table may not exist yet if schema was skipped
        console.log(`→ Seeding: ${path.relative(root, seedPath)}`);
        await runSqlFile(seedPath);
        console.log('✓ Seed applied');
      }
    }
    console.log('✓ DB setup complete');
  } catch (err) {
    console.error('✗ DB setup failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
