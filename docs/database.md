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
as seed migrations: the runner will bcrypt-hash `process.env.ADMIN_PASSWORD`
(default `Admin@123!`) and update the `admin` user's `password_hash`
immediately after the seed SQL runs.

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

`ADMIN_PASSWORD` env var controls the default `admin` user's password.
Default is `Admin@123!` (the migration runner bcrypt-hashes it at apply
time). Set it in `backend/.env` or your shell before first boot, or update
the password directly via the API after the user is created.
