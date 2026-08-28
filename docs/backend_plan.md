# Backend Implementation Plan

## Web-Based Smart Traffic Signal & Queue Simulation System

**Stack:** Node.js + Express · PostgreSQL (Docker) · Socket.io · TypeScript

---

## 1. Project Structure

```
backend/
├── src/
│   ├── app.ts                    # Express entry point
│   ├── server.ts                 # HTTP + WebSocket server bootstrap
│   ├── config/
│   │   └── db.ts                 # PostgreSQL connection pool (pg)
│   ├── models/
│   │   ├── signal.model.ts       # Signal CRUD operations
│   │   ├── queueHistory.model.ts # Queue history CRUD
│   │   └── vehicleLog.model.ts   # Vehicle log CRUD
│   ├── engine/
│   │   ├── simulationEngine.ts   # Core tick loop (setInterval)
│   │   ├── signalFSM.ts          # Finite State Machine (RED→GREEN→YELLOW→RED)
│   │   └── queueModel.ts         # M/M/1 queuing theory calculations
│   ├── routes/
│   │   ├── signals.routes.ts     # /api/signals CRUD
│   │   ├── simulation.routes.ts  # /api/simulation start/stop/reset/status
│   │   └── history.routes.ts     # /api/history query
│   ├── websocket/
│   │   └── liveSocket.ts         # Socket.io event emitting per tick
│   ├── middleware/
│   │   ├── errorHandler.ts       # Global error handler
│   │   └── cors.ts               # CORS configuration
│   └── utils/
│       └── poisson.ts            # Poisson random arrival generator
├── tests/
│   ├── fsm.test.ts               # FSM state transition tests
│   ├── queue.test.ts             # M/M/1 formula verification
│   └── api.test.ts               # REST endpoint tests
├── database/
│   ├── schema.sql                # PostgreSQL DDL (3 tables)
│   └── seed.sql                  # Sample data (2 signals)
├── package.json
├── tsconfig.json
├── .env                          # DB credentials, port
└── README.md
```

---

## 2. Database Setup (PostgreSQL on Docker)

### 2.1 Docker Compose

Already configured in `postgres-setup/docker-compose.yml`:
- **PostgreSQL** on port `5432` (user: `admin`, password: `admin`, db: `mydb`)
- **pgAdmin** on port `5050` for visual management

### 2.2 Schema (`database/schema.sql`)

```sql
-- Table 1: signals
CREATE TABLE IF NOT EXISTS signals (
    id            SERIAL PRIMARY KEY,
    name          VARCHAR(100) NOT NULL,
    current_state VARCHAR(10)  NOT NULL DEFAULT 'RED'
                  CHECK (current_state IN ('GREEN', 'YELLOW', 'RED')),
    green_duration INTEGER NOT NULL DEFAULT 30,
    red_duration   INTEGER NOT NULL DEFAULT 30,
    yellow_duration INTEGER NOT NULL DEFAULT 5,
    created_at    TIMESTAMP DEFAULT NOW()
);

-- Table 2: queue_history
CREATE TABLE IF NOT EXISTS queue_history (
    id            SERIAL PRIMARY KEY,
    signal_id     INTEGER NOT NULL REFERENCES signals(id) ON DELETE CASCADE,
    timestamp     TIMESTAMP DEFAULT NOW(),
    queue_length  INTEGER NOT NULL DEFAULT 0,
    avg_wait_time REAL    NOT NULL DEFAULT 0,
    utilization   REAL    NOT NULL DEFAULT 0,
    arrival_rate  REAL    NOT NULL DEFAULT 0
);

-- Table 3: vehicle_log
CREATE TABLE IF NOT EXISTS vehicle_log (
    id            SERIAL PRIMARY KEY,
    signal_id     INTEGER NOT NULL REFERENCES signals(id) ON DELETE CASCADE,
    arrived_at    TIMESTAMP NOT NULL DEFAULT NOW(),
    served_at     TIMESTAMP,
    wait_seconds  REAL
);

-- Indexes for query performance
CREATE INDEX idx_queue_history_signal ON queue_history(signal_id);
CREATE INDEX idx_queue_history_time   ON queue_history(timestamp);
CREATE INDEX idx_vehicle_log_signal   ON vehicle_log(signal_id);
```

### 2.3 Seed Data (`database/seed.sql`)

```sql
INSERT INTO signals (name, green_duration, red_duration)
VALUES
    ('North Lane', 30, 30),
    ('South Lane', 30, 30);
```

### 2.4 Database Connection (`src/config/db.ts`)

Use the `pg` package with a connection pool:

```ts
import { Pool } from 'pg';

const pool = new Pool({
    host:     process.env.DB_HOST     || 'localhost',
    port:     Number(process.env.DB_PORT) || 5432,
    user:     process.env.DB_USER     || 'admin',
    password: process.env.DB_PASSWORD || 'admin',
    database: process.env.DB_NAME     || 'mydb',
});

export default pool;
```

---

## 3. Core Engine Modules

### 3.1 Signal FSM (`src/engine/signalFSM.ts`)

| Property | Description |
|---|---|
| **States** | `RED`, `GREEN`, `YELLOW` |
| **Transitions** | `RED → GREEN → YELLOW → RED` (deterministic) |
| **Initial state** | `RED` |
| **Trigger** | `timer_expired` (timer hits 0) |

**Key methods:**

| Method | Responsibility |
|---|---|
| `constructor(id, greenDur, redDur, yellowDur)` | Initialize FSM with durations |
| `tick()` | Decrement timer; trigger state transition at 0 |
| `getState()` | Return current state + time remaining |
| `reset()` | Reset to initial RED state |

**Transition logic:**
- Each `tick()` decrements the internal timer by 1
- When timer reaches 0, transition to the next state and reset timer to that state's duration
- Log every state change to the `signals` table in PostgreSQL

### 3.2 Queue Model (`src/engine/queueModel.ts`)

**M/M/1 Queuing Theory Implementation:**

| Metric | Formula | Description |
|---|---|---|
| Traffic Intensity (ρ) | `ρ = λ / μ` | Must be < 1 for stable queue |
| Avg Queue Length (Lq) | `Lq = ρ² / (1 − ρ)` | Mean vehicles waiting |
| Avg Wait Time (Wq) | `Wq = Lq / λ` | Mean seconds in queue |
| System Utilization | `U = ρ × 100%` | How busy the intersection is |

**Key methods:**

| Method | Responsibility |
|---|---|
| `generateArrivals(lambda, deltaT)` | Poisson random arrival generator |
| `serveVehicles(mu, deltaT)` | Process vehicles during GREEN phase |
| `computeMetrics(lambda, mu)` | Calculate `{ rho, Lq, Wq, utilization }` |
| `getQueueLength()` | Current vehicle count in queue |

**Poisson arrival generator** (`src/utils/poisson.ts`):
- Use the inverse transform method to generate Poisson-distributed random arrivals
- `P(k arrivals) = (λ^k * e^(-λ)) / k!`

### 3.3 Simulation Engine (`src/engine/simulationEngine.ts`)

**Core tick loop running every 1000ms:**

```
Each tick():
  1. For each signal:
     a. signalFSM.tick()          → advance signal state
     b. queueModel.generateArrivals(λ) → add new vehicles
     c. If signal is GREEN:
        queueModel.serveVehicles(μ)    → remove vehicles from queue
     d. queueModel.computeMetrics()    → calculate ρ, Lq, Wq
  2. Save snapshot to queue_history table
  3. Log individual vehicles to vehicle_log table
  4. Emit state via WebSocket to all connected clients
  5. Increment simulation tick counter
```

**Key methods:**

| Method | Responsibility |
|---|---|
| `start()` | Begin `setInterval(tick, 1000)` loop |
| `stop()` | Clear interval, pause simulation |
| `reset()` | Clear all queues, reset FSMs, truncate logs |
| `tick()` | Single simulation step (see above) |
| `getStatus()` | Return `{ running, currentTick }` |
| `setSpeedMultiplier(x)` | Adjust tick interval (1x, 5x, 10x) |

**Adaptive Signal Mode:**
- Monitor queue length each tick
- If queue > threshold (e.g., 10 vehicles), extend current GREEN phase by up to 15 extra seconds
- Store current mode (`MANUAL` or `ADAPTIVE`) as engine state

---

## 4. REST API Endpoints

### 4.1 Signals Routes (`src/routes/signals.routes.ts`)

| Method | Endpoint | Request Body | Response |
|---|---|---|---|
| `GET` | `/api/signals` | — | `Signal[]` with current state |
| `POST` | `/api/signals` | `{ name, green_duration, red_duration }` | Created signal |
| `PUT` | `/api/signals/:id` | `{ green_duration?, red_duration? }` | Updated signal |
| `GET` | `/api/signals/:id/stats` | — | `{ queueLength, avgWaitTime, utilization, arrivalRate }` |

### 4.2 Simulation Routes (`src/routes/simulation.routes.ts`)

| Method | Endpoint | Request Body | Response |
|---|---|---|---|
| `POST` | `/api/simulation/start` | `{ speedMultiplier? }` | `{ message: "started" }` |
| `POST` | `/api/simulation/stop` | — | `{ message: "stopped" }` |
| `POST` | `/api/simulation/reset` | — | `{ message: "reset" }` |
| `GET` | `/api/simulation/status` | — | `{ running, currentTick }` |

### 4.3 History Routes (`src/routes/history.routes.ts`)

| Method | Endpoint | Query Params | Response |
|---|---|---|---|
| `GET` | `/api/history` | `signal_id`, `limit` | `QueueHistory[]` |

---

## 5. WebSocket (Socket.io)

### 5.1 Setup (`src/websocket/liveSocket.ts`)

- Attach Socket.io to the HTTP server
- On each simulation tick, emit `'tick-update'` event to all connected clients

### 5.2 Payload (emitted every tick)

```json
{
    "tick": 42,
    "signals": [
        {
            "signalId": 1,
            "name": "North Lane",
            "state": "GREEN",
            "timeRemaining": 18,
            "queueLength": 7,
            "avgWaitTime": 14.3,
            "utilization": 0.72,
            "arrivalRate": 0.6
        }
    ],
    "mode": "MANUAL"
}
```

### 5.3 Events

| Event | Direction | Description |
|---|---|---|
| `tick-update` | Server → Client | Full state snapshot every tick |
| `connection` | Client → Server | New dashboard connected |
| `disconnect` | Client → Server | Dashboard disconnected |

---

## 6. Phased Implementation Schedule

### Phase 1: Project Setup & Database (Days 1–3)

- [ ] Initialize Node.js project with TypeScript (`npm init`, `tsc --init`)
- [ ] Install dependencies: `express`, `pg`, `socket.io`, `cors`, `dotenv`
- [ ] Install dev dependencies: `typescript`, `ts-node-dev`, `jest`, `@types/*`
- [ ] Create `.env` file with DB credentials
- [ ] Create `src/config/db.ts` — connection pool
- [ ] Create `database/schema.sql` — 3 tables with indexes
- [ ] Create `database/seed.sql` — 2 sample signals
- [ ] Run schema + seed against PostgreSQL Docker container
- [ ] Create `src/models/signal.model.ts` — CRUD for signals table
- [ ] Create `src/models/queueHistory.model.ts` — insert/query queue history
- [ ] Create `src/models/vehicleLog.model.ts` — insert/query vehicle logs
- [ ] Verify all DB operations with manual testing via pgAdmin

### Phase 2: Signal FSM (Days 4–5)

- [ ] Create `src/engine/signalFSM.ts` — SignalFSM class
- [ ] Implement states: RED, GREEN, YELLOW with configurable durations
- [ ] Implement `tick()` — decrement timer, trigger transition at 0
- [ ] Log state changes to `signals` table
- [ ] Write `tests/fsm.test.ts`:
  - Verify RED→GREEN→YELLOW→RED cycle
  - Verify timer decrements correctly
  - Verify multiple simultaneous signal instances

### Phase 3: Queuing Theory Module (Days 6–7)

- [ ] Create `src/utils/poisson.ts` — Poisson arrival generator
- [ ] Create `src/engine/queueModel.ts` — QueueModel class
- [ ] Implement `generateArrivals(lambda, deltaT)` using Poisson distribution
- [ ] Implement `serveVehicles(mu, deltaT)` for GREEN phase processing
- [ ] Implement `computeMetrics(lambda, mu)` → `{ rho, Lq, Wq, utilization }`
- [ ] Add per-vehicle logging (arrived_at, served_at, wait_seconds)
- [ ] Write `tests/queue.test.ts`:
  - Verify ρ < 1 for stable system
  - Verify Lq and Wq formulas
  - Verify Poisson arrival distribution

### Phase 4: Simulation Engine + WebSocket + REST API (Days 8–10)

- [ ] Create `src/engine/simulationEngine.ts` — SimulationEngine class
- [ ] Implement `start()`, `stop()`, `reset()`, `tick()` methods
- [ ] Integrate SignalFSM + QueueModel in each tick
- [ ] Set up Socket.io in `src/websocket/liveSocket.ts`
- [ ] Emit `tick-update` event with full state payload every tick
- [ ] Create `src/routes/signals.routes.ts` — GET/POST/PUT signals
- [ ] Create `src/routes/simulation.routes.ts` — start/stop/reset/status
- [ ] Create `src/routes/history.routes.ts` — GET history with filters
- [ ] Create `src/app.ts` — Express app with middleware + route mounting
- [ ] Create `src/server.ts` — HTTP server + WebSocket bootstrap
- [ ] Create `src/middleware/errorHandler.ts` — global error handler
- [ ] Create `src/middleware/cors.ts` — CORS for Next.js frontend
- [ ] Test with Postman / wscat that data flows correctly

### Phase 5: Adaptive Mode & Speed Control (Days 11–12)

- [ ] Add adaptive mode logic to simulation engine
- [ ] Monitor queue length each tick; extend GREEN if queue > threshold
- [ ] Add mode toggle endpoint: `POST /api/simulation/mode`
- [ ] Add speed multiplier support (1x, 5x, 10x)
- [ ] Add arrival rate adjustment endpoint

### Phase 6: Testing & Polish (Days 13–14)

- [ ] Write `tests/api.test.ts` — REST endpoint integration tests
- [ ] End-to-end test: start simulation, run 5 minutes, verify DB logs
- [ ] Verify response time < 2 seconds for all API endpoints
- [ ] Test multi-signal scenarios (4 intersections simultaneously)
- [ ] Handle edge cases: ρ ≥ 1 warning, empty queue, rapid start/stop

---

## 7. Dependencies

```json
{
    "dependencies": {
        "express": "^4.18.x",
        "pg": "^8.11.x",
        "socket.io": "^4.7.x",
        "cors": "^2.8.x",
        "dotenv": "^16.x"
    },
    "devDependencies": {
        "typescript": "^5.x",
        "ts-node-dev": "^2.x",
        "@types/express": "^4.x",
        "@types/pg": "^8.x",
        "@types/cors": "^2.x",
        "jest": "^29.x",
        "ts-jest": "^29.x",
        "@types/jest": "^29.x"
    }
}
```

---

## 8. Environment Variables (`.env`)

```env
PORT=3001
DB_HOST=localhost
DB_PORT=5432
DB_USER=admin
DB_PASSWORD=admin
DB_NAME=mydb
CORS_ORIGIN=http://localhost:3000
```

---

## 9. Key Design Decisions

| Decision | Rationale |
|---|---|
| **TypeScript** | Type safety for FSM states, metrics, and API payloads |
| **pg (node-postgres)** | Direct PostgreSQL driver — lightweight, no ORM overhead |
| **Socket.io** | Battle-tested WebSocket library with automatic reconnection |
| **setInterval** for tick loop | Simple, reliable; avoid busy-waiting |
| **Connection pool** | Efficient DB access during high-frequency tick writes |
| **Separate engine module** | Clean separation — FSM + Queue + Engine are independently testable |

---

## 10. Common Pitfalls to Avoid

- ❌ Forgetting to clear the queue when signal resets → phantom vehicles
- ❌ Emitting WebSocket events too fast (< 100ms) → throttle to 1s minimum
- ❌ Not validating ρ < 1 before displaying metrics → show warning if unstable
- ❌ Mixing simulation time with real time → keep a dedicated `simulationTick` counter
- ❌ Hardcoding arrival rates → always make λ configurable
- ❌ Not handling DB connection errors → use pool error events
