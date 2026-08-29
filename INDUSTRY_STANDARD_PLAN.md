# Industry-Standard Transformation Plan — Traffic Signal Simulation

> **Last updated:** 2026-08-29  
> **Stack:** Node.js/Express + Next.js + PostgreSQL + Socket.IO + TypeScript  
> **Goal:** Reshape the codebase to production-grade, maintainable, secure, and team-scalable standards.

---

## 1. Codebase Audit — Current State (post-`fa00726`)

### 1.1 What is now done — industry-grade

After the `refactor: make codebase industry standard` commit, the foundational pillars are in place:

| Area                                                                                                                           | Where                                                        | Status |
| ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------ | ------ |
| Monorepo with `npm` workspaces                                                                                                 | `package.json:7`                                             | Done   |
| Shared `tsconfig.base.json`, root `eslint.config.mjs`, `prettier.config.mjs`, `.editorconfig`, `.gitattributes`, `.nvmrc`      | repo root                                                    | Done   |
| Zod env validation, no `JWT_SECRET` fallback in code                                                                           | `backend/src/config/env.ts:22`                               | Done   |
| `.env.example` for root, backend, frontend                                                                                     | repo root, `backend/`, `frontend/`                           | Done   |
| `.gitignore` covers `dist/`, `.next/`, `coverage/`, secrets                                                                    | `.gitignore`                                                 | Done   |
| `helmet`, `compression`, `cors` allowlist, `pino-http`, `express-rate-limit`                                                   | `app.ts:22-32`                                               | Done   |
| `AppError`, `asyncHandler`, Zod-aware error handler, requestId, hide stack in prod                                             | `lib/errors.ts`, `middleware/*`                              | Done   |
| Zod validation middleware on every protected route                                                                             | `routes/*.ts`                                                | Done   |
| `pino` structured logging (JSON prod / pretty dev)                                                                             | `config/logger.ts`                                           | Done   |
| Health & readiness probes with DB check                                                                                        | `app.ts:37-48`                                               | Done   |
| Graceful shutdown, unhandled rejection, uncaught exception                                                                     | `server.ts:47-75`                                            | Done   |
| WebSocket: JWT auth, 250ms throttle, 50-client cap                                                                             | `websocket/liveSocket.ts`                                    | Done   |
| Pagination envelope on history                                                                                                 | `routes/history.routes.ts:26`                                | Done   |
| Multi-stage `Dockerfile.backend` (non-root, alpine, healthcheck)                                                               | `backend/Dockerfile`                                         | Done   |
| Multi-stage `Dockerfile.frontend` (Next standalone)                                                                            | `frontend/Dockerfile`                                        | Done   |
| Root `docker-compose.yml` (postgres + backend + frontend + pgadmin) with healthchecks                                          | `docker-compose.yml`                                         | Done   |
| `.dockerignore`                                                                                                                | present                                                      | Done   |
| GitHub Actions CI: lint + typecheck + build + test + docker smoke                                                              | `.github/workflows/ci.yml`                                   | Done   |
| `next.config.ts`: `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `output: 'standalone'` | `frontend/next.config.ts`                                    | Done   |
| Frontend env loader, ErrorBoundary                                                                                             | `frontend/src/lib/env.ts`, `components/ui/ErrorBoundary.tsx` | Done   |
| Backend tests: FSM (8), queue (11), API integration (8)                                                                        | `backend/tests/`                                             | Done   |
| No `console.log` left in `src/`                                                                                                | grep clean                                                   | Done   |
| Only `bcryptjs` (no `bcrypt` confusion)                                                                                        | `backend/package.json`                                       | Done   |
| No hardcoded `secret_key_for_dev_only` in src                                                                                  | grep clean                                                   | Done   |
| No `Design.html` orphan at root                                                                                                | moved to `docs/legacy-canvas-demo.html`                      | Done   |

### 1.2 Remaining gaps (15% — polish, not structural)

| #   | Gap                                                                                                                                                 | Severity | File(s)                                                                                                              |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | -------------------------------------------------------------------------------------------------------------------- |
| 1   | `ts-node-dev` still listed in devDependencies (deprecated; `tsx` already does the job)                                                              | Low      | `backend/package.json:66`                                                                                            |
| 2   | No versioned DB migrations — `initDb.ts` uses `information_schema` ad-hoc; `migrate.ts` re-runs `schema.sql` blindly (idempotent but not versioned) | Medium   | `config/initDb.ts`, `config/migrate.ts`, `database/`                                                                 |
| 3   | Frontend has **no tests** (no Vitest/RTL/msw)                                                                                                       | Medium   | `frontend/package.json`                                                                                              |
| 4   | No `husky` / `lint-staged` (CI runs lint but pre-commit does not)                                                                                   | Low      | `.husky/` missing                                                                                                    |
| 5   | Residual `any` types in 8 places (mostly `(req as any).requestId` — fixable with one `Express.Request` augmentation)                                | Low      | `app.ts:28`, `errorHandler.ts:8`, `requestId.ts:6`, `validate.ts:5-22`, `server.ts:41,76`, `simulationEngine.ts:317` |
| 6   | No OpenAPI / Swagger spec generated from zod schemas                                                                                                | Low      | not present                                                                                                          |
| 7   | Stale `backend_plan.md` / `frontend_plan.md` still in `docs/`                                                                                       | Low      | `docs/`                                                                                                              |
| 8   | No `CODEOWNERS`, no `dependabot.yml`, no `CONTRIBUTING.md`                                                                                          | Low      | missing                                                                                                              |
| 9   | Inline `await import('../models/queueHistory.model')` in `signals.routes.ts:80`                                                                     | Low      | `routes/signals.routes.ts:80`                                                                                        |
| 10  | `frontend/src/lib/api.ts` uses `any` for all payloads; should use shared types                                                                      | Low      | `lib/api.ts:46-72`                                                                                                   |
| 11  | No Jest coverage threshold                                                                                                                          | Low      | `backend/package.json:23-29`                                                                                         |
| 12  | WebSocket `tick-update` event not declared in shared types                                                                                          | Low      | `websocket/liveSocket.ts:43`                                                                                         |

### 1.3 Verdict

**The codebase is structurally industry-standard.** Phases 1–3 of the original plan are complete. The remaining items are quality-of-life and defensive polish — none block production deployment of the current architecture.

---

## 2. Target Architecture (current — already implemented)

```
project_trafficSim/
├── .github/workflows/ci.yml
├── .editorconfig / .gitattributes / .nvmrc
├── docker-compose.yml
├── Dockerfile.backend (in backend/)  /  Dockerfile.frontend (in frontend/)
├── .dockerignore
├── package.json                 # npm workspaces root
├── tsconfig.base.json
├── eslint.config.mjs            # shared (backend uses root; frontend has its own)
├── prettier.config.mjs
├── backend/
│   ├── src/
│   │   ├── app.ts / server.ts
│   │   ├── config/   env.ts, db.ts, logger.ts (pino), initDb.ts, migrate.ts
│   │   ├── lib/      errors.ts (AppError, asyncHandler)
│   │   ├── middleware/  auth, validate (zod), rateLimit, requestId, errorHandler, cors
│   │   ├── engine/   simulationEngine, signalFSM, queueModel
│   │   ├── routes/   auth, signals, simulation, history, analytics
│   │   ├── models/   pg queries
│   │   ├── websocket/  liveSocket
│   │   └── utils/    poisson
│   ├── database/     schema.sql, seed.sql
│   ├── tests/        fsm, queue, api
│   ├── .env.example
│   └── Dockerfile
└── frontend/
    ├── src/
    │   ├── app/      (dashboard, config, login, history, analytics, layout)
    │   ├── components/  ui/ErrorBoundary, layout, dashboard, history, auth
    │   ├── context/  AuthContext
    │   ├── hooks/    useSimulation, useSignals, useSocket
    │   ├── lib/      api.ts, socket.ts, env.ts
    │   └── types/    index.ts
    ├── .env.example
    ├── next.config.ts (security headers + standalone)
    └── Dockerfile
```

---

## 3. Phased Plan to Close the Remaining 15%

### Phase A — Type & Dependency Cleanup (½ day)

**Goal:** Eliminate the last `any` leaks, remove deprecated devDeps, fix inline dynamic imports.

- [ ] Remove `ts-node-dev` from `backend/package.json` devDependencies
- [ ] `backend/src/types/express.d.ts` → augment `Express.Request` with `requestId` and `user`, then drop all `(req as any).requestId`
- [ ] `backend/src/lib/validate.ts` → drop `any` on `ZodObject<any>` (use `z.ZodTypeAny` or generic)
- [ ] `backend/src/models/queueHistory.model.ts:72` → return type `Promise<AggregatedSummary>` instead of `Promise<any>`
- [ ] `backend/src/models/signal.model.ts:39` → type `values` as `unknown[]` or `Array<string | number>`
- [ ] `signals.routes.ts:80` → static `import { QueueHistoryModel } from '../models/queueHistory.model'`
- [ ] `simulationEngine.ts:317`, `server.ts:41,76` → `err: unknown` + `instanceof Error` narrowing

**Verification:** `npm run typecheck` clean, `npm run lint` clean, zero new `any` introduced.

---

### Phase B — Database Versioning (1 day)

**Goal:** Reproducible, traceable DB schema changes.

- [ ] Add a `migrations` table (`id, name, applied_at`) created on startup if missing
- [ ] Move SQL files from `backend/database/` → `backend/database/migrations/V001__initial.sql`, `V002__seed_signals.sql`
- [ ] `initDb.ts` records applied migrations and runs only the missing ones
- [ ] `migrate.ts` becomes the single CLI for forward migrations
- [ ] Keep `database/seed.sql` as bootstrap but generated password via env (`ADMIN_PASSWORD`) instead of hardcoded hash
- [ ] Document the migration workflow in `docs/database.md`

**Verification:** Drop & recreate DB → `npm run db:migrate` reproduces the full schema; re-running is a no-op.

---

### Phase C — Frontend Testing (1 day)

**Goal:** Catch UI regressions and lock in the auth/control flow.

- [ ] Add `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`, `msw` to `frontend/devDependencies`
- [ ] Add `vitest.config.ts` (jsdom env, `src/test/setup.ts` for jest-dom)
- [ ] Add `test`, `test:watch`, `test:coverage` scripts to `frontend/package.json`
- [ ] Write tests for:
  - `lib/api.ts` — auth header injection, 401 token clearing
  - `lib/socket.ts` — connection with token, reconnect on disconnect
  - `context/AuthContext.tsx` — login → me → logout flow
  - `components/auth/ProtectedRoute.tsx` — redirect when unauthenticated
- [ ] Wire `test` into root `package.json` script and CI

**Verification:** `npm test` in `frontend/` runs ≥8 specs green; CI step added.

---

### Phase D — Pre-commit Hygiene (½ day)

**Goal:** Fail fast on lint/format issues before pushing.

- [ ] `npm i -D husky lint-staged` at root
- [ ] `husky init` → create `.husky/pre-commit` running `npx lint-staged`
- [ ] `package.json` → add `lint-staged` config: `*.{ts,tsx}` → `eslint --fix` + `prettier --write`
- [ ] `npm run prepare` script → `husky`

**Verification:** Make a small unstaged change with a lint error → commit is blocked with a clear message.

---

### Phase E — OpenAPI from Zod (1 day)

**Goal:** Self-documenting API; replace ad-hoc hand-maintained endpoint list in `README.md`.

- [ ] `npm i -D @asteasolutions/zod-to-openapi zod-to-openapi` (or use `zod-openapi` schemas)
- [ ] Annotate existing zod schemas with `.openapi(...)` metadata
- [ ] Generate `openapi.json` at startup; mount `swagger-ui-express` at `/api/docs`
- [ ] Update `README.md` API table link to point at `/api/docs`

**Verification:** `GET /api/docs` renders Swagger UI; `GET /api/openapi.json` returns valid spec; all routes documented.

---

### Phase F — Repo Hygiene & Shared Types (½ day)

**Goal:** Tidy stale docs, add ownership automation, share types.

- [ ] `docs/backend_plan.md` + `docs/frontend_plan.md` → either delete or move to `docs/archive/` with a `NOTE: superseded by INDUSTRY_STANDARD_PLAN.md`
- [ ] Add `.github/CODEOWNERS` (assign `*` to maintainer)
- [ ] Add `.github/dependabot.yml` for `npm` weekly updates
- [ ] Add `CONTRIBUTING.md` (short: scripts, env, branch naming, PR template link)
- [ ] `frontend/src/types/socket.ts` → declare `tick-update`, `simulation-status` event payloads; reuse from `lib/socket.ts`
- [ ] `frontend/src/lib/api.ts` → replace `any` payloads with `Signal`, `SimulationStatus`, etc. from `types/index.ts`
- [ ] `backend/package.json` → add `jest --coverage --coverageThreshold` for `engine/`, `lib/`, `middleware/`

**Verification:** `npm run typecheck` clean; `npm run test:coverage` reports ≥70% on backend engine + lib + middleware.

---

## 4. Non-Goals (still out of scope)

- Switching to an ORM — `pg` + versioned SQL stays
- Microservices split — keep the monolith, the `engine/` is already pure-domain
- Full i18n / theming system — keep the existing dark theme

---

## 5. Risks & Mitigations

| Risk                                                    | Mitigation                                                                                             |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Frontend test setup pulls in `jsdom` and slows CI       | Cache `node_modules`; run frontend tests with `--reporter=basic`                                       |
| Migrations introduce drift if someone hand-edits the DB | Make the runner log every applied migration and refuse to run if `migrations` table is missing in prod |
| OpenAPI adds `~80KB` to backend image                   | Lazy-load Swagger UI only when `NODE_ENV !== 'production'` or behind a flag                            |

---

## 6. Execution Order (recommended)

1. **Phase A** (½ day) — quick type wins
2. **Phase D** (½ day) — pre-commit hook (lands first because it gates future commits)
3. **Phase C** (1 day) — frontend tests
4. **Phase B** (1 day) — DB migrations
5. **Phase F** (½ day) — repo hygiene + shared types
6. **Phase E** (1 day) — OpenAPI

**Total: ~4.5 working days**

After each phase: `npm run lint && npm run typecheck && npm run test && npm run build` must stay green.

---

## 7. Definition of Done (final)

- [ ] Zero `any` outside vendored types
- [ ] `npm run lint && npm run typecheck && npm run test && npm run build` green on all workspaces
- [ ] `docker compose up --build` boots full stack, `/api/health` returns 200, WebSocket connects with valid JWT
- [ ] `/api/docs` renders Swagger UI
- [ ] `git commit` blocks on lint/format errors
- [ ] CI green on `main`
- [ ] `README.md` links to live API docs and `CONTRIBUTING.md`
