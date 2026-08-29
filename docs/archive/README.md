# Archived Plans

The documents in this directory are **superseded** and kept for historical reference only.

## Superseded by

[`INDUSTRY_STANDARD_PLAN.md`](../../INDUSTRY_STANDARD_PLAN.md) at the repository root is the single source of truth for the current architecture, phased rollout, and quality bar.

## Contents

| File               | Notes                                                                                                                              |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| `backend_plan.md`  | Original backend implementation plan (Node + Express + Postgres + Socket.io). Predates the industry-standard refactor (`fa00726`). |
| `frontend_plan.md` | Original frontend implementation plan (Next.js + Chart.js). Predates the industry-standard refactor (`fa00726`).                   |

## Why they are archived

These documents describe the **initial build** of the system. After the
`refactor: make codebase industry standard` commit, the architecture, tooling,
security posture, and operational expectations were upgraded (Zod env validation,
pino logging, helmet, rate limiting, multi-stage Dockerfiles, CI, etc.). Tracking
those changes across two redundant plan files created drift and review noise.

If you are looking for what to do next, read `INDUSTRY_STANDARD_PLAN.md` and the
open issues/PRs.
