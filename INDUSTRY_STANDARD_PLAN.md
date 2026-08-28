# Industry-Standard Transformation Plan — Traffic Signal Simulation

> **Date:** 2026-08-29  
> **Stack:** Node.js/Express + Next.js + PostgreSQL + Socket.IO + TypeScript  
> **Goal:** Reshape the codebase to production-grade, maintainable, secure, and team-scalable standards.

---

## 1. Codebase Audit — Current State

### 1.1 What is good (keep)
- Clear domain separation: `engine/` (FSM, queue, simulation), `routes/`, `models/`, `websocket/`
- TypeScript everywhere, strict mode enabled
- JWT + RBAC (ADMIN/VIEWER) already present
- Centralized phase controller avoids signal drift — solid domain fix
- Batched DB writes (`insertBatch`, `logArrivalBatch`) — good perf awareness
- WebSocket throttling (250ms) + max clients cap

### 1.2 Structural gaps — why not industry standard

| Category | Finding | Severity | File(s) |
|---|---|---|---|
| **Monorepo** | Root `package.json` is a hack (`concurrently` + `cd` scripts), no workspaces, no shared TS config, no `pnpm`/`npm workspaces` | High | `package.json:6-12` |
| **Env** | No `.env.example`, no validation (`zod`), `JWT_SECRET` falls back to `secret_key_for_dev_only` in 3 files | Critical | `middleware/auth.ts:5`, `routes/auth.routes.ts:9`, `websocket/liveSocket.ts:29`, `backend/.env` exposed |
| **Security** | No `helmet`, no `express-rate-limit`, CORS allows credentials without explicit origin list, `bcrypt` + `bcryptjs` both installed (confusing), passwords logged? | High | `app.ts:14-18`, `package.json:27-28` |
| **Validation** | Manual `typeof` checks scattered across routes, no `zod`/`joi`, no centralized validator middleware | High | `routes/signals.routes.ts:28-35`, `routes/simulation.routes.ts:78-94` |
| **Error handling** | `errorHandler.ts:3` only handles 500, no `AppError` class, no `asyncHandler`, unhandled rejections not caught, `catch(err:any)` everywhere | High | `middleware/errorHandler.ts` |
| **Logging** | `console.log` with emojis — no `pino`/`winston`, no log levels, no requestId, not JSON in prod, retention job logs to stdout | Medium | `server.ts:23-42`, `engine/*.ts` |
| **DB** | Raw `schema.sql` + `seed.sql` via `psql` CLI with hardcoded `PGPASSWORD=admin`, no migrations (e.g. `node-pg-migrate`), seed re-runs blindly, no transaction | High | `package.json:11-13`, `config/initDb.ts` |
| **Observability** | No health/readiness probes, no `/api/health` DB check, no graceful shutdown, no metrics, no `compression` | Medium | `app.ts:22-24`, `server.ts:26-31` |
| **Tooling** | No `eslint` in backend, no `prettier`, no `husky`/`lint-staged`, no `.editorconfig`, `ts-node-dev` deprecated | Medium | `backend/package.json` |
| **API design** | No pagination envelope, no `GET /api/signals/:id/stats` caching, inline `await import()` in route handler, no OpenAPI/Swagger | Medium | `routes/signals.routes.ts:95` |
| **WebSocket** | `require('jsonwebtoken')` inline, no typed events, no room isolation | Low | `websocket/liveSocket.ts:29` |
| **Frontend** | No shared types (`frontend/src/types` duplicates backend), no `prettier`, no tests (RTL/Vitest), no error boundaries, `next.config.ts` empty, no security headers, no `env` validation | Medium | `frontend/*` |
| **DevOps** | No Dockerfile, no `docker-compose.yml` for full stack (only DB), no `CI` (GitHub Actions), no `.dockerignore`, no `dependabot` | High | `postgres-setup/docker-compose.yml` |
| **Git** | Root `.gitignore` has 3 lines, missing `dist/`, `.next/`, `coverage/`, `*.log`; `frontend/.gitignore` is boilerplate; secrets in `backend/.env` tracked? | High | `.gitignore` |
| **Docs** | `backend_plan.md` / `frontend_plan.md` are stale plan artifacts in repo, `Design.html` orphan at root (611 lines canvas demo unrelated to app) | Low | `Design.html`, `*/plan.md` |
| **Testing** | `tests/` exists but `tsconfig.exclude` removes it, `jest` preset minimal, no coverage threshold, no e2e | Medium | `backend/package.json:15-21` |

---

## 2. Target Architecture — Industry Standard

```
project_trafficSim/
├── .github/
│   └── workflows/
│       ├── ci.yml                # lint + typecheck + test + build
│       └── codeql.yml            # security scan
├── .husky/                       # pre-commit hooks
├── .editorconfig
├── .nvmrc
├── docker-compose.yml            # full stack (db + backend + frontend)
├── Dockerfile.backend
├── Dockerfile.frontend
├── .dockerignore
├── package.json                  # npm workspaces root
├── tsconfig.base.json            # shared TS config
├── eslint.config.mjs             # shared eslint (flat config)
├── prettier.config.mjs
├── packages/
│   ├── shared/                   # shared types, zod schemas, constants
│   └── ...                       # (future libs)
├── backend/
│   ├── src/
│   │   ├── app.ts                # express app (no side effects)
│   │   ├── server.ts             # bootstrap + graceful shutdown
│   │   ├── config/
│   │   │   ├── env.ts            # zod-validated env
│   │   │   ├── db.ts
│   │   │   ├── logger.ts         # pino
│   │   │   └── initDb.ts
│   │   ├── lib/
│   │   │   ├── errors.ts         # AppError, asyncHandler
│   │   │   └── pagination.ts
│   │   ├── middleware/
│   │   │   ├── auth.ts
│   │   │   ├── validate.ts       # zod validator
│   │   │   ├── requestId.ts
│   │   │   ├── errorHandler.ts
│   │   │   └── rateLimit.ts
│   │   ├── modules/              # vertical slices (alternative to routes/models)
│   │   │   ├── auth/
│   │   │   ├── signals/
│   │   │   ├── simulation/
│   │   │   ├── history/
│   │   │   └── analytics/
│   │   ├── engine/               # pure domain (no DB imports)
│   │   └── websocket/
│   ├── migrations/               # node-pg-migrate or SQL versioned
│   ├── tests/
│   ├── .env.example
│   └── package.json
└── frontend/
    ├── src/
    │   ├── app/
    │   ├── components/
    │   ├── lib/
    │   │   ├── api.ts
    │   │   └── env.ts            # zod env
    │   └── types/                # re-export from @shared
    ├── .env.example
    └── package.json
```

---

## 3. Phased Execution Plan

### Phase 0 — Audit & Plan (this document) ✅
- Deliver `INDUSTRY_STANDARD_PLAN.md`
- Freeze API contract before refactors

### Phase 1 — Foundation & Security (Day 1)
**Goal:** Fail-safe env, consistent tooling, security baseline.

- [ ] Root `package.json` → `npm workspaces` (`"workspaces": ["backend","frontend","packages/*"]`), remove `concurrently` hack, add `turbo` or `npm run dev --workspaces`
- [ ] Shared `tsconfig.base.json` + `eslint.config.mjs` + `prettier.config.mjs` + `.editorconfig` + `.nvmrc` (node 20)
- [ ] Backend: `npm i -D eslint prettier eslint-config-prettier` + `husky` + `lint-staged`
- [ ] Create `backend/src/config/env.ts` (zod) — validates `PORT`, `DB_*`, `JWT_SECRET` (no fallback in prod), `CORS_ORIGIN`, `NODE_ENV`; throw on missing
- [ ] Remove all `process.env.JWT_SECRET || 'secret_key_for_dev_only'` fallbacks; use `env.JWT_SECRET`
- [ ] `backend/.env.example` + `frontend/.env.example` + update `.gitignore` (root + backend + frontend)
- [ ] Backend: `helmet`, `express-rate-limit`, `compression`, `express-mongo-sanitize` not needed, add `cors` with allowlist
- [ ] Remove duplicate `bcrypt` (keep `bcryptjs`), dedupe
- [ ] Delete orphan `Design.html` or move to `docs/`

### Phase 2 — Backend Hardening (Day 2-3)
**Goal:** Predictable API, typed validation, structured errors/logs, health.

- [ ] Create `src/lib/errors.ts` → `AppError(status, message, code)` + `asyncHandler(fn)` wrapper
- [ ] Rewrite `middleware/errorHandler.ts` → handle `AppError`, `ZodError`, `JsonWebTokenError`, hide stack in prod, log with `pino`
- [ ] Create `middleware/validate.ts` → `validate(schema)` for `body/query/params` using `zod`
- [ ] Create `config/logger.ts` → `pino` with `pino-http`, JSON in prod, pretty in dev
- [ ] Add `middleware/requestId.ts` + `helmet` + `rateLimit` (login: 5/min, simulation control: 20/min)
- [ ] Replace manual `if (!name)` checks in `routes/*.ts` with `zod` schemas; wrap handlers with `asyncHandler`
- [ ] Add `GET /api/health` (app + DB) and `GET /api/ready` (DB + engine state)
- [ ] Graceful shutdown in `server.ts` (`SIGTERM`/`SIGINT` → close server → drain pool → clearInterval)
- [ ] Fix `websocket/liveSocket.ts:29` → `import jwt from 'jsonwebtoken'` + use `env`
- [ ] Standardize pagination envelope: `{ data: T[], meta: { total, page, limit } }`

### Phase 3 — Database & DevOps (Day 3-4)
**Goal:** Reproducible DB, containerized app, CI.

- [ ] Introduce `migrations/` (e.g. `node-pg-migrate` or versioned `migrations/*.sql` with `migrate` script); remove `PGPASSWORD=admin psql` hack
- [ ] Seed via `migrations/seed.ts` with idempotent `ON CONFLICT DO NOTHING` + env-driven admin password (not hardcoded hash)
- [ ] `docker-compose.yml` at root: `postgres` + `backend` + `frontend` + `pgadmin` (profile `tools`); healthchecks
- [ ] `Dockerfile.backend` (multi-stage: deps → build → runner, non-root user, `NODE_ENV=production`)
- [ ] `Dockerfile.frontend` (multi-stage Next standalone)
- [ ] `.dockerignore` files
- [ ] GitHub Actions `ci.yml`: `actions/setup-node`, `npm ci`, `lint`, `typecheck`, `test --coverage`, `build`, `docker build` smoke
- [ ] `dependabot.yml` or `renovate`

### Phase 4 — Frontend Hardening (Day 4-5)
**Goal:** Type-safe, tested, accessible UI.

- [ ] Create `packages/shared` (or at least `frontend/src/lib/env.ts` with zod) + re-export backend types
- [ ] Add `prettier` + `eslint` strict + `husky`
- [ ] `next.config.ts`: `headers()` → `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`; `output: 'standalone'` for Docker
- [ ] Add `components/ui/ErrorBoundary.tsx` + `app/error.tsx` + `loading.tsx` per route
- [ ] `lib/api.ts`: typed responses, `ApiError` with `code`, auto-refresh token hook (future)
- [ ] Add `Vitest` + `React Testing Library` + `msw` for API mocking; add `__tests__/`
- [ ] Fix `lib/socket.ts` to use `env` + typed events

### Phase 5 — Observability & Docs (Day 5-6)
**Goal:** Operable and self-documenting.

- [ ] OpenAPI spec (`swagger-jsdoc` + `swagger-ui-express` at `/api/docs`) generated from zod schemas
- [ ] Structured logs shipped to stdout (12-factor); no file logs in container
- [ ] Add `CONTRIBUTING.md`, `ARCHITECTURE.md`, overhaul `README.md` with badges, env table, `make dev` quickstart
- [ ] Remove `backend_plan.md`/`frontend_plan.md` from repo (archive to `docs/` if needed)
- [ ] Add `LICENSE` check, `CODEOWNERS`

### Phase 6 — Verification
- [ ] `npm run lint && npm run typecheck && npm run test` green on both workspaces
- [ ] `docker compose up --build` boots full stack, `GET /api/health` returns 200, WebSocket connects with valid JWT, `npm run build` succeeds
- [ ] No `console.log` left outside `logger`, no `any` in new code, no hardcoded secrets

---

## 4. Non-Goals (out of scope for this reshape)
- Switching DB to ORM (stay with `pg` for simplicity; migration layer only)
- Microservices split (keep monolith, but modularize `modules/`)
- Full i18n or theming system (keep existing dark theme tokens)

---

## 5. Risks & Mitigations
| Risk | Mitigation |
|---|---|
| Env validation breaks local dev | Provide `.env.example` + `env.ts` allows defaults only in `NODE_ENV=development` with warning |
| zod adds bundle size | Backend only; frontend uses subset |
| Docker build slow | Use `npm ci --omit=dev` + layer caching |
| Migration drift | Make `initDb.ts` check `migrations` table, not `information_schema` |

---

## 6. Immediate Next Steps (when user confirms)
Run `Phase 1` in this order: `env.ts` → `.env.example` → `.gitignore` → `workspaces` → `eslint/prettier/husky` → `helmet/rateLimit` → verify `npm run dev` still works.
