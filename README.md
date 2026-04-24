# Traffic Simulation System

A real-time traffic control center simulation built as a 3rd year project. Models intersections using finite state machines and queue theory, with a live dashboard, adaptive AI mode, and role-based access control.

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

## Project Structure

```
project_trafficSim/
├── frontend/          # Next.js app
│   └── src/
│       ├── app/       # Pages (dashboard, config, login, history, analytics)
│       ├── components/
│       ├── context/   # AuthContext
│       ├── hooks/
│       └── lib/       # API client
├── backend/           # Express API + simulation engine
│   ├── src/
│   │   ├── engine/    # simulationEngine.ts, signalFSM.ts, queueModel.ts
│   │   ├── routes/    # simulation, signals, auth, analytics, history
│   │   ├── models/
│   │   ├── middleware/ # JWT auth
│   │   └── websocket/ # Socket.IO live updates
│   └── database/
│       ├── schema.sql
│       └── seed.sql
└── postgres-setup/
    └── docker-compose.yml
```

## Getting Started

### Prerequisites

- Node.js 18+
- Docker

### 1. Start the Database

```bash
cd postgres-setup
docker compose up -d
```

This starts PostgreSQL on port `5432` and pgAdmin on `http://localhost:5050`.

### 2. Set Up the Backend

```bash
cd backend
cp .env.example .env   # configure DB connection and JWT secret
npm install
npm run db:setup       # runs schema.sql + seed.sql
npm run dev
```

Backend runs on `http://localhost:3001`.

### 3. Start the Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:3000`.

## Default Credentials

| Username | Password | Role |
|---|---|---|
| `admin` | `admin123` | Admin |

> Change the admin password after first login.

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
