# GREENWAVE — Backend Integration

**Version:** 0.2.0
**Status:** hybrid sim model — client sim is authoritative for vehicles, backend runs a parallel audit engine that validates client snapshots.

## Architecture

```
┌────────────────────┐   POST /api/commands/*   ┌─────────────────────┐
│   FRONTEND SIM     │ ───────────────────────► │  BACKEND CONTROLLER │
│ (LocalProvider)    │                          │   (auditRunner)     │
│                    │ ◄───── Socket.IO ──────  │                     │
│  vehicles, paths,  │    (snapshot / event)    │  phase FSM, drift   │
│  queues, HUD       │                          │  log, durations     │
└────────────────────┘                          └─────────────────────┘
                                                          │
                                                          ▼
                                                  ┌──────────────┐
                                                  │  PostgreSQL  │
                                                  │ junction_def │
                                                  │ event_log    │
                                                  │ phase_dur.   │
                                                  └──────────────┘
```

The client sim ticks at 60 fps and renders the full vehicle kinematics. The backend runs a lighter audit engine that mirrors only the phase FSM (G → Y → R → next), so the two engines must agree on phase/interval/simT but the backend does not simulate individual vehicles.

Every 5s the client pushes an `ApiSnapshot` to `/api/commands/:id/snapshot`. The audit runner compares to its own snapshot; any field that drifts beyond a threshold is logged to `event_log` with `tag='sys'`.

## 5-junction domain

| ID    | Code | Name          | Shape  | Legs |
|-------|------|---------------|--------|------|
| cross | J07  | CENTRAL CROSS | cross  | 4    |
| round | J12  | RING PLAZA    | round  | 4    |
| y     | J21  | MERIDIAN SPLIT| y      | 3    |
| t     | J33  | HARBOR TEE    | t      | 3    |
| penta | J45  | CIVIC PENTA   | penta  | 5    |

`penta` is a 5-way intersection at 72° spacing, added in the 0.2.0 release. It sits isolated on the network map (no through-roads) and ships with 5 phases.

## REST surface

### `/api/junctions` (auth)
- `GET /` — list all junction_def rows
- `GET /:id` — single junction
- `PUT /:id/durations` (ADMIN) — update `phase_durations` + propagate to live engine
- `GET /:id/snapshot` — latest `EngineSnapshot`

### `/api/commands` (auth)
- `POST /:id/reset` (ADMIN)
- `POST /:id/set-mode` (ADMIN) — `fixed` | `actuated` | `manual`
- `POST /:id/preempt` (ADMIN) — `{ leg: number }`
- `POST /:id/ped-call` (ADMIN) — `{ side: number }`
- `POST /:id/force-phase` (ADMIN) — `{ phase: number }`
- `POST /:id/snapshot` (any auth) — client pushes its current snapshot

### `/api/telemetry` (auth)
- `GET /junctions` — list of all junctions with current snapshot
- `GET /junction/:id` — full snapshot
- `GET /junction/:id/events?sinceMs=&limit=` — recent `event_log` rows
- `GET /junction/:id/spark` — phase log points (used for cold-reload backfill)
- `GET /junction/:id/drifts` (ADMIN) — recent drift entries

## Auth

JWT issued by `POST /api/auth/login` (requires `{username, email, password}` — derive username from email local-part in the UI). The client stores the token in `localStorage` under `gw_jwt` and sends it as `Authorization: Bearer <token>` on every REST call and in `socket.handshake.auth.token` for the WebSocket.

## Configuration

- `NEXT_PUBLIC_API_URL` (frontend) — defaults to `http://localhost:3001`
- `NEXT_PUBLIC_WS_URL` (frontend) — defaults to `http://localhost:3001`
- `CORS_ORIGIN` (backend) — defaults to `http://localhost:3000`
- `JWT_SECRET` (backend) — min 32 chars
- `JWT_EXPIRES_IN` (backend) — defaults to `24h`
- `AUDIT_MODE` (backend) — currently `shadow`; reserved for future `off` mode

## Drift detection

The audit engine logs drift to `event_log` with `tag='sys'`. Inspect with:

```sql
SELECT recorded_at, t, msg FROM event_log
WHERE junction_id = 'cross' AND tag = 'sys' AND msg LIKE 'DRIFT%'
ORDER BY recorded_at DESC LIMIT 20;
```

A `auditDrift.test.ts` unit test exercises the drift path with mocked models.

## Smoke test

```bash
bash scripts/smoke.sh
```

Exercises health, login, junctions list, telemetry list (5 rows), reset, preempt, snapshot push.

## Outstanding cleanup (deferred)

The legacy 2-group phase FSM (`backend/src/engine/simulationEngine.ts`) and its routes (`/api/signals`, `/api/simulation`) still ship alongside the new audit runner for one release. They are no longer used by the new UI but are kept for backward compatibility. Removal is scheduled for the 0.3.0 release after a separate audit.
