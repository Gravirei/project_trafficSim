# TrafficSim Demo Frontend

This demo uses a simplified traffic queue model based on **M/M/1 queueing theory**. The main idea is that vehicles arrive at an average rate `lambda` and are served by the signal at a service rate `mu`.

```text
rho = lambda / mu
Lq = rho^2 / (1 - rho)
Wq = Lq / lambda
U = rho * 100%
```

`rho` shows how busy a lane is, `Lq` estimates average queue length, `Wq` estimates average waiting time, and `U` shows utilization as a percentage. In this standalone demo, those values are generated locally from dummy data instead of the backend/database.

## `src` Structure

```text
src/
├── app/
│   ├── config/
│   │   └── page.tsx
│   │       Fixed four-lane configuration page. Lets the user edit green, yellow, and red timing values only.
│   ├── history/
│   │   └── page.tsx
│   │       Static history table page. Contains hard-coded dummy records and a simple lane filter.
│   ├── favicon.ico
│   │   Browser tab icon used by the Next.js app.
│   ├── globals.css
│   │   Global theme variables, reset styles, shared panel styles, button styles, and metric typography.
│   ├── layout.tsx
│   │   Root Next.js layout. Adds metadata, global CSS, navbar, and the main page container.
│   ├── page.module.css
│   │   Copied CSS module from the original frontend. Currently unused by the demo pages.
│   └── page.tsx
│       Main dashboard page. Shows manual-mode controls, live intersection view, lane cards, queue bars, and metrics.
├── components/
│   ├── dashboard/
│   │   ├── ControlPanel.tsx
│   │   │   Dashboard controls for start, pause, reset, simulation speed, and arrival rate.
│   │   ├── IntersectionVisualizer.tsx
│   │   │   Canvas-based top-down intersection animation with moving vehicles, traffic lights, zoom, and pan.
│   │   ├── LiveMetrics.tsx
│   │   │   Small metrics grid for arrival rate, utilization, average queue length, and average wait time.
│   │   ├── QueueBar.tsx
│   │   │   Horizontal queue severity bar. Color changes from green to yellow to red as queue length rises.
│   │   └── SignalLight.tsx
│   │       Compact red/yellow/green light display with countdown timer.
│   └── layout/
│       └── Navbar.tsx
│           Fixed top navigation for Dashboard, History, and Config with a demo-data status indicator.
├── hooks/
│   ├── useSignals.ts
│   │   Local signal configuration hook. Reads the four demo lanes and updates timing values in memory.
│   ├── useSimulation.ts
│   │   Local simulation control hook. Starts, stops, resets, and updates speed/arrival rate in the demo store.
│   └── useSocket.ts
│       Backend-free live data hook. Simulates ticking updates from local demo data and always reports connected.
├── lib/
│   ├── api.ts
│   │   Small local API facade for signal reads/updates. Kept so copied UI code can call API-like methods without a backend.
│   └── demoData.ts
│       In-memory demo store. Holds four lane configs, simulation status, tick generation, queue estimates, and subscriptions.
└── types/
    └── index.ts
        Shared TypeScript interfaces for signals, ticks, simulation status, and history records.
```

## Run

```bash
npm install
npm run dev
```

Use another port if needed:

```bash
npm run dev -- --port 3002
```

## Checks

```bash
npm run lint
npm run build
```
