import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'node:path';

// Cross-platform: load .env from multiple locations (root .env, backend/.env)
// Works on Windows (C:\...), macOS, Linux — path.resolve handles separators.
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), 'backend', '.env') });
// Also try relative to this file (when cwd is backend/ or root/)
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../..', 'backend', '.env') });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3001),
  DB_HOST: z.string().min(1).default('localhost'),
  DB_PORT: z.coerce.number().int().min(1).max(65535).default(5432),
  DB_USER: z.string().min(1).default('admin'),
  DB_PASSWORD: z.string().min(1).default('admin'),
  DB_NAME: z.string().min(1).default('mydb'),
  CORS_ORIGIN: z.string().min(1).default('http://localhost:3000'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('24h'),
});

function formatZodError(error: z.ZodError): string {
  return error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
}

let parsed: z.infer<typeof envSchema>;

try {
  parsed = envSchema.parse(process.env);
} catch (err) {
  if (err instanceof z.ZodError) {
    const msg = `❌ Invalid environment variables: ${formatZodError(err)}`;
    // In production fail fast; in dev also fail fast to avoid silent misconfig
    console.error(msg);
    throw new Error(msg);
  }
  throw err;
}

export const env = parsed;
