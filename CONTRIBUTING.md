# Contributing

Thanks for contributing to the **Web-Based Smart Traffic Signal & Queue Simulation System**.
This guide covers the day-to-day workflow. For long-term direction, read
[`INDUSTRY_STANDARD_PLAN.md`](./INDUSTRY_STANDARD_PLAN.md).

## Prerequisites

| Tool    | Version       | Notes                                                         |
| ------- | ------------- | ------------------------------------------------------------- |
| Node.js | `>=20.0.0`    | Enforced via `package.json#engines`. Use `nvm` if you can.    |
| npm     | `>=10.0.0`    | Ships with Node 20.                                           |
| Docker  | latest stable | Required for Postgres + the dev stack (`npm run dev:docker`). |
| Git     | recent        | Conventional Commits rely on merge-friendly messages.         |

## Setup

```bash
# 1. Clone
git clone <repo-url>
cd project_trafficSim

# 2. Install workspaces
npm install

# 3. Configure env (one-time per machine)
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
# edit secrets — at minimum backend/.env needs a 32+ char JWT_SECRET

# 4. Start the dev stack
npm run dev:docker          # full stack (db + backend + frontend) in Docker
# OR
npm run db:up               # only Postgres via docker compose
npm run dev                 # backend + frontend locally (see scripts/dev.mjs)
```

The first run takes a couple of minutes while Docker pulls images. After that,
incremental rebuilds are fast.

## Branch naming

Use a short, kebab-cased prefix that describes the change:

| Prefix      | Use for                                  |
| ----------- | ---------------------------------------- |
| `feat/`     | New user-facing functionality            |
| `fix/`      | Bug fixes                                |
| `refactor/` | Internal cleanup with no behavior change |
| `docs/`     | Documentation-only changes               |
| `chore/`    | Tooling, deps, CI                        |
| `test/`     | Adding or fixing tests                   |

Examples: `feat/adaptive-threshold-ui`, `fix/ws-token-expiry`,
`refactor/extract-queue-model`.

## Commit messages — Conventional Commits

```
<type>(<scope>): <short summary>

<body — wrap at 72 chars, explain *why* not *what*>

<footer — e.g. Closes #123, BREAKING CHANGE: ...>
```

Allowed `<type>` values: `feat`, `fix`, `refactor`, `docs`, `chore`, `test`,
`style`, `perf`, `build`, `ci`. Keep the subject line under 72 characters and
in the imperative mood (`add`, not `added`).

## Local quality gates

Run these **before** opening a PR. CI will run them again — failing locally
just wastes a round trip.

```bash
# Lint
npm run lint

# Typecheck (root, backend, frontend)
npm run typecheck

# Tests
npm run test               # all workspaces
npm run test --workspace=backend -- --coverage   # optional coverage report

# Format check
npm run format:check
```

## Pull request process

1. Cut a branch using the convention above.
2. Keep PRs small and focused — one logical change per PR.
3. Make sure `npm run lint`, `npm run typecheck`, and `npm run test` are green
   locally.
4. Push and open a PR against `main`.
5. Fill in the PR template:
   - **What** changed (1–3 bullets)
   - **Why** (link the issue / design doc)
   - **How to test** (steps + screenshots for UI work)
   - **Risk / rollback** notes if anything is user-visible
6. Address review feedback with follow-up commits — avoid force-pushes after
   review starts (use `git commit --fixup` to keep history clean).
7. Squash-merge once CI is green and you have at least one approving review
   from a CODEOWNER.

> If your change touches a file listed in `.github/CODEOWNERS`, GitHub will
> automatically request a review from the listed owner(s). That is the only
> formal review requirement.

## Reporting issues

- Bugs: include repro steps, expected vs actual, browser/OS, and relevant logs.
- Feature requests: link to the relevant section of `INDUSTRY_STANDARD_PLAN.md`
  if one exists, or propose a new section.

## Code of conduct

Be kind. Disagree on ideas, not on people. This is a university project today
and an open-source candidate tomorrow — keep the bar professional.
