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

| Layer | Tech |
|---|---|
| Frontend | Next.js 16, React 19, TypeScript, Chart.js, Socket.IO client |
| Backend | Node.js, Express 5, TypeScript, Socket.IO |
| Database | PostgreSQL |
| Auth | JWT (jsonwebtoken) + bcryptjs |
| Dev DB | Docker + pgAdmin |

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

- Node.js 20+ (`nvm use`)
- Docker + Docker Compose

### Quickstart (Docker — recommended)

```bash
cp backend/.env.example backend/.env   # set JWT_SECRET (min 32 chars)
cp frontend/.env.example frontend/.env.local
docker compose up --build
# Frontend: http://localhost:3000
# Backend:  http://localhost:3001/api/health
#           http://localhost:3001/api/ready
```

### Local dev (without Docker)

```bash
# 1. Database only
npm run db:up   # or: docker compose -f postgres-setup/docker-compose.yml up -d

# 2. Backend
cd backend
cp .env.example .env
npm install
npm run dev      # http://localhost:3001

# 3. Frontend (separate terminal)
cd frontend
npm install
npm run dev      # http://localhost:3000
```

### Scripts (from repo root)

```bash
npm run lint        # eslint across workspaces
npm run typecheck   # tsc --noEmit
npm run build       # build both apps
npm run test        # jest (backend)
npm run format      # prettier write
```

## Environment Variables

| Var | Required | Default | Description |
|---|---|---|---|
| `JWT_SECRET` | ✅ (prod) | — | Min 32 chars, no fallback in prod |
| `CORS_ORIGIN` | — | `http://localhost:3000` | Comma-separated allowlist |
| `DB_HOST/PORT/USER/PASSWORD/NAME` | — | `localhost:5432/admin/mydb` | Postgres |
| `NEXT_PUBLIC_API_URL` | — | `http://localhost:3001` | Frontend API base |

See `backend/.env.example` and `frontend/.env.example`.

## Default Credentials (seed)

| Username | Email | Password | Role |
|---|---|---|---|
| `admin` | `admin_auth@gravirei.com` | `Tr4ff1cS1m@2026!` | Admin |

> Change the admin password after first login. Seed hash is in `backend/database/seed.sql`.

## API Overview

| Endpoint | Method | Auth | Admin Only |
|---|---|---|---|
| `/api/auth/login` | POST | ❌ | ❌ |
| `/api/auth/me` | GET | ✅ | ❌ |
| `/api/auth/register` | POST | ✅ | ✅ |
| `/api/simulation/status` | GET | ✅ | ❌ |
| `/api/simulation/start` | POST | ✅ | ✅ |
| `/api/simulation/stop` | POST | ✅ | ✅ |
| `/api/simulation/mode` | POST | ✅ | ✅ |
| `/api/signals` | GET | ✅ | ❌ |
| `/api/signals` | POST | ✅ | ✅ |
| `/api/analytics/summary` | GET | ✅ | ❌ |
| `/api/history` | GET | ✅ | ❌ |
| WebSocket `tick-update` | — | ✅ | ❌ |

## Running Tests

```bash
cd backend
npm test
```

Tests cover the simulation FSM, queue model, and API route protection.

## License

MIT
