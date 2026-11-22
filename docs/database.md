# Database Migrations

The backend uses a simple versioned migration system backed by PostgreSQL.
All SQL lives in `backend/database/migrations/`, sorted and applied in
filename order at server startup or via the CLI.

## Layout

```
backend/database/
  migrations/
    V001__initial_schema.sql      # core tables + indexes
    V002__seed_signals.sql        # default 4-way intersection + admin user
    V003__junction_definitions.sql
    V004__phase_durations.sql
    V005__event_preempt_ped_log.sql
    V006__seed_junctions.sql      # default junction definitions
    V007__seed_admin_password.sql # one-time admin password reset for upgrades
  schema.sql -> migrations/V001__initial_schema.sql  # legacy symlink
  seed.sql   -> migrations/V002__seed_signals.sql    # legacy symlink
```

`schema.sql` and `seed.sql` remain as symlinks so older tooling (e.g.
`scripts/db-setup.mjs`) keeps working without changes.

## Naming

Files follow the pattern `V###__description.sql`:

- `V` — capital V prefix
- `###` — zero-padded sequence number (`001`, `002`, ...)
- `__` — double underscore separator
- `description.sql` — short snake_case description ending in `.sql`

To keep ordering stable, always use a higher number than the latest existing
migration. Files that contain the word `seed` (case-insensitive) are treated
as seed migrations: the runner requires `ADMIN_PASSWORD`, bcrypt-hashes it,
and updates the `admin` user's `password_hash` after the seed SQL runs. There
is no built-in password.

## Tracking table

Applied migrations are recorded in the `migrations` table:

| Column       | Type        | Notes                           |
| ------------ | ----------- | ------------------------------- |
| `id`         | serial PK   | autoincrement                   |
| `name`       | text        | unique — the migration filename |
| `applied_at` | timestamptz | default `now()`                 |

The table is auto-created on first run. Re-running on a populated database
is a no-op.

## Running migrations

The runner is invoked automatically when the server starts (see
`src/server.ts` -> `ensureDatabaseReady`), and on demand via:

```bash
cd backend
npm run db:migrate
```

Both paths go through `src/config/migrations.ts::runMigrations` and share
the same idempotency guarantees.

## Adding a new migration

1. Create `backend/database/migrations/V00X__short_description.sql`.
2. Write forward-only SQL. Use `CREATE TABLE IF NOT EXISTS`,
   `CREATE INDEX IF NOT EXISTS`, `ON CONFLICT DO NOTHING/UPDATE`, etc. so
   the migration is safe if a developer runs the runner mid-edit.
3. For seed data with passwords, follow the same pattern as
   `V002__seed_signals.sql`: insert a placeholder `password_hash` and let
   the runner overwrite it with a bcrypt hash.
4. Run `npm run db:migrate` locally to verify.
5. Commit the file. CI / server startup will apply it on next deploy.

## Local admin password

`ADMIN_PASSWORD` controls the seeded `admin` user's password. Set a unique value
in `backend/.env` before first boot. Migration V007 also applies this configured
password once to existing installations; later changes to the environment
variable do not rotate an already-migrated account.
