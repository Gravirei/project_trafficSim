#!/usr/bin/env node
/**
 * Cross-platform dev runner — Windows, macOS, Linux
 * Replaces `npm run db:up && concurrently ...` which breaks on PowerShell 5 and old cmd.
 *
 * Usage: node scripts/dev.mjs  (or: npm run dev)
 */
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

function run(cmd, args, opts = {}) {
  // shell:false is cross-platform (Windows uses CreateProcess, no cmd.exe quoting issues)
  // For `docker compose` and `npx concurrently` this is required for Windows.
  const child = spawn(cmd, args, {
    stdio: 'inherit',
    cwd: root,
    windowsHide: true,
    ...opts,
  });
  return child;
}

async function wait(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  console.log('→ Starting postgres (docker compose up -d) ...');
  const db = run('docker', ['compose', '-f', 'postgres-setup/docker-compose.yml', 'up', '-d']);
  await new Promise((resolve, reject) => {
    db.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`docker compose up failed: ${code}`))));
  });

  // Small wait to let Postgres accept connections on slow machines (healthcheck will also gate backend)
  await wait(1500);

  console.log('→ Starting backend + frontend (concurrently) ...');
  const conc = run('npx', ['concurrently', '-c', 'cyan,magenta', '-n', 'BACKEND,FRONTEND', 'npm run start:backend', 'npm run start:frontend']);

  const onSignal = () => {
    conc.kill('SIGINT');
    run('docker', ['compose', '-f', 'postgres-setup/docker-compose.yml', 'down']);
  };
  process.on('SIGINT', onSignal);
  process.on('SIGTERM', onSignal);

  conc.on('close', (code) => process.exit(code ?? 0));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
