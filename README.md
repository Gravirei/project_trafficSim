# Traffic Simulation System

![CI](https://github.com/anomalyco/opencode/actions/workflows/ci.yml/badge.svg)
![Node](https://img.shields.io/badge/node-%3E%3D20-brightgreen)
![License](https://img.shields.io/badge/license-MIT-blue)

A real-time traffic control center simulation built as a 3rd year project. Models intersections using finite state machines and queue theory, with a live dashboard, adaptive AI mode, and role-based access control with user safety first.

## Features

- **Real-time simulation** — traffic signals cycle through states (FSM) with vehicle queue modeling per intersection
- **Two control modes** — Manual (operator-set timings) and Adaptive AI (auto-adjusts based on queue lengths)
- **Live dashboard** — WebSocket-powered updates for signal states, queue lengths, and throughput
- **Analytics & History** — charts for vehicle throughput, wait times, and historical simulation runs
- **JWT Auth + RBAC** — Admin operators can control the simulation; Viewers get read-only access

## Tech Stack

| Layer    | Tech                                                         |
| -------- | ------------------------------------------------------------ |
| Frontend | Next.js 16, React 19, TypeScript, Chart.js, Socket.IO client |
| Backend  | Node.js, Express 5, TypeScript, Socket.IO                    |
| Database | PostgreSQL                                                   |
| Auth     | JWT (jsonwebtoken) + bcryptjs                                |
| Dev DB   | Docker + pgAdmin                                             |

## Project Structure (Industry Standard)

```
project_trafficSim/
├── docker-compose.yml        # full stack (postgres + backend + frontend + pgadmin)
├── Dockerfile.backend / frontend
├── .github/workflows/ci.yml  # lint + typecheck + test + docker smoke
├── backend/
│   ├── src/
│   │   ├── config/    # env.ts (zod), db.ts, logger.ts (pino), initDb.ts
│   │   ├── lib/       # errors.ts (AppError, asyncHandler)
│   │   ├── middleware/ # auth, validate (zod), rateLimit, requestId, errorHandler
│   │   ├── engine/    # simulationEngine, signalFSM, queueModel (pure domain)
│   │   ├── routes/    # auth, signals, simulation, history, analytics
│   │   ├── models/    # pg queries
│   │   └── websocket/ # Socket.IO + JWT auth
│   ├── database/      # schema.sql, seed.sql, migrate.ts
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── app/       # Next.js App Router (dashboard, config, login, history, analytics)
│   │   ├── components/ # ui/ErrorBoundary, dashboard, layout
│   │   ├── lib/       # api.ts, socket.ts, env.ts
│   │   └── context/   # AuthContext
│   └── Dockerfile (standalone)
└── docs/              # archived plans + legacy demo
```

See `INDUSTRY_STANDARD_PLAN.md` for the full transformation audit and phased plan.

## Getting Started

### Prerequisites

| Requirement | Version | Windows                                         | macOS                           | Linux                   |
| ----------- | ------- | ----------------------------------------------- | ------------------------------- | ----------------------- |
| Node.js     | 20+     | `winget install OpenJS.NodeJS` or `nvm-windows` | `brew install node@20` or `nvm` | `nvm` / package manager |
| npm         | 10+     | bundled with Node                               | bundled                         | bundled                 |
| Docker      | 24+     | Docker Desktop                                  | Docker Desktop / Colima         | Docker Engine           |

> `.nvmrc` and `.node-version` both point to `20` — use `nvm use` (macOS/Linux) or `nvm use 20` (Windows nvm-windows) or `fnm use`.

### Quickstart (Docker — recommended, works identically on Windows/macOS/Linux)

```bash
# 1. Configure env (all platforms: copy example, no shell-specific syntax)
#    Windows (PowerShell/CMD):  copy backend\.env.example backend\.env
#    macOS/Linux:               cp backend/.env.example backend/.env
cp backend/.env.example backend/.env   # set JWT_SECRET (min 32 chars) — required
cp frontend/.env.example frontend/.env.local

# 2. Start full stack (needs Docker Desktop / Engine running)
docker compose up --build
# Frontend: http://localhost:3000
# Backend:  http://localhost:3001/api/health
#           http://localhost:3001/api/ready
# pgAdmin (tools profile):  docker compose --profile tools up -d

# Stop:
docker compose down
```

### Local dev (without Docker full stack)

Works the same on **Windows (PowerShell/CMD), macOS, Linux** — no `PGPASSWORD` or Unix-only `&&` required.

```bash
# 1. Database only (requires Docker)
npm run db:up          # cross-platform: docker compose -f postgres-setup/docker-compose.yml up -d
# Alternative full-stack wait: npm run db:up:wait

# 2. Backend — cross-platform DB setup (no `psql` CLI needed)
npm run db:setup --workspace=backend   # runs node scripts/db-setup.mjs via pg (Windows/macOS/Linux)
# or: npm run db:migrate --workspace=backend

# 3. Run backend + frontend together (cross-platform)
npm run dev            # → node scripts/dev.mjs (Windows-safe, no PowerShell && issue)
# Alternative: runs separately
npm run start:backend  # → npm run dev --workspace=backend (tsx watch)
npm run start:frontend # → npm run dev --workspace=frontend (next dev)

# Or run individually:
# Terminal 1:
npm run dev --workspace=backend   # http://localhost:3001
# Terminal 2:
npm run dev --workspace=frontend  # http://localhost:3000
```

<details>
<summary>Windows-specific notes</summary>

- Use **PowerShell** or **CMD** — `npm run dev` now uses `node scripts/dev.mjs` so `&&` and `PGPASSWORD=...` are not required.
- If `docker` not found, install **Docker Desktop** and enable WSL2 backend.
- `psql` is **not required** — `scripts/db-setup.mjs` uses Node `pg` driver.
- Line endings are normalized to `LF` via `.gitattributes:1` — no CRLF issues on clone.
- If `npm ci` fails on native deps, run `npm install` or `npm rebuild`.

</details>

<details>
<summary>macOS / Linux notes</summary>

- `brew install node@20` + `docker` / `colima` works.
- `npm run dev:legacy` still available for Unix shells if you prefer `&&` + `concurrently`.

</details>

### Scripts (from repo root — all cross-platform)

```bash
npm run lint              # eslint across workspaces
npm run typecheck         # tsc --noEmit
npm run build             # build both apps
npm run test              # jest --forceExit (backend, 34 tests)
npm run format            # prettier write
npm run db:up             # docker compose postgres up -d
npm run db:down           # docker compose postgres down
npm run dev               # cross-platform dev (node scripts/dev.mjs)
npm run dev:docker        # docker compose up --build (full stack)
npm run dev:docker:down   # docker compose down
```

## Environment Variables

| Var                               | Required  | Default                     | Description                       |
| --------------------------------- | --------- | --------------------------- | --------------------------------- |
| `JWT_SECRET`                      | ✅ (prod) | —                           | Min 32 chars, no fallback in prod |
| `CORS_ORIGIN`                     | —         | `http://localhost:3000`     | Comma-separated allowlist         |
| `DB_HOST/PORT/USER/PASSWORD/NAME` | —         | `localhost:5432/admin/mydb` | Postgres                          |
| `NEXT_PUBLIC_API_URL`             | —         | `http://localhost:3001`     | Frontend API base                 |

See `backend/.env.example` and `frontend/.env.example`.

## Default Credentials (seed)

| Username | Email                     | Password           | Role  |
| -------- | ------------------------- | ------------------ | ----- |
| `admin`  | `admin_auth@gravirei.com` | `Tr4ff1cS1m@2026!` | Admin |

> Change the admin password after first login. Seed hash is in `backend/database/seed.sql`.

## API Overview

| Endpoint                 | Method | Auth | Admin Only |
| ------------------------ | ------ | ---- | ---------- |
| `/api/docs`              | GET    | ❌   | ❌         |
| `/api/openapi.json`      | GET    | ❌   | ❌         |
| `/api/auth/login`        | POST   | ❌   | ❌         |
| `/api/auth/me`           | GET    | ✅   | ❌         |
| `/api/auth/register`     | POST   | ✅   | ✅         |
| `/api/simulation/status` | GET    | ✅   | ❌         |
| `/api/simulation/start`  | POST   | ✅   | ✅         |
| `/api/simulation/stop`   | POST   | ✅   | ✅         |
| `/api/simulation/mode`   | POST   | ✅   | ✅         |
| `/api/signals`           | GET    | ✅   | ❌         |
| `/api/signals`           | POST   | ✅   | ✅         |
| `/api/analytics/summary` | GET    | ✅   | ❌         |
| `/api/history`           | GET    | ✅   | ❌         |
| WebSocket `tick-update`  | —      | ✅   | ❌         |

- `GET /api/docs` — Swagger UI (interactive API documentation)
- `GET /api/openapi.json` — OpenAPI 3.0 spec (raw JSON)

## Running Tests

```bash
cd backend
npm test
```

Tests cover the simulation FSM, queue model, and API route protection.

## License

MIT
