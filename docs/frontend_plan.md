# Frontend Implementation Plan

## Web-Based Smart Traffic Signal & Queue Simulation System

**Stack:** Next.js (React) · TypeScript · Chart.js · Socket.io-client · CSS3

---

## 1. Project Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Root layout (fonts, global styles)
│   │   ├── page.tsx                # Dashboard (main page)
│   │   ├── history/
│   │   │   └── page.tsx            # History page
│   │   ├── config/
│   │   │   └── page.tsx            # Signal configuration page
│   │   └── analytics/
│   │       └── page.tsx            # Analytics page
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Navbar.tsx          # Navigation bar
│   │   │   └── Footer.tsx          # Footer
│   │   ├── dashboard/
│   │   │   ├── SignalLight.tsx     # Traffic signal widget (animated CSS circles)
│   │   │   ├── QueueBar.tsx        # Horizontal queue bar (colored by severity)
│   │   │   ├── LiveMetrics.tsx     # λ, μ, ρ, Lq, Wq display panel
│   │   │   ├── QueueChart.tsx      # Chart.js scrolling line chart (last 60s)
│   │   │   ├── ControlPanel.tsx    # Start / Stop / Reset + arrival rate slider
│   │   │   ├── ModeToggle.tsx      # Manual vs Adaptive mode switch
│   │   │   └── SpeedControl.tsx    # 1x / 5x / 10x speed multiplier
│   │   ├── history/
│   │   │   ├── HistoryChart.tsx    # Bar/line charts from /api/history
│   │   │   └── HistoryFilters.tsx  # Signal filter + time range
│   │   ├── analytics/
│   │   │   ├── UtilizationGauge.tsx # Donut/gauge chart for utilization
│   │   │   └── ThroughputTable.tsx  # Throughput statistics table
│   │   └── config/
│   │       ├── SignalForm.tsx      # Create/edit signal form
│   │       └── SignalList.tsx      # List of all configured signals
│   ├── hooks/
│   │   ├── useSocket.ts           # WebSocket connection hook
│   │   ├── useSimulation.ts       # Simulation state management
│   │   └── useSignals.ts          # Signal CRUD API hook
│   ├── lib/
│   │   ├── api.ts                 # Axios/fetch wrapper for REST calls
│   │   └── socket.ts              # Socket.io client singleton
│   ├── types/
│   │   └── index.ts               # TypeScript interfaces
│   └── styles/
│       └── globals.css            # Global styles + design tokens
├── public/
│   └── favicon.ico
├── package.json
├── tsconfig.json
├── next.config.ts
└── README.md
```

---

## 2. TypeScript Interfaces (`src/types/index.ts`)

```ts
// Signal state from backend
export interface Signal {
    id: number;
    name: string;
    current_state: 'GREEN' | 'YELLOW' | 'RED';
    green_duration: number;
    red_duration: number;
    yellow_duration: number;
}

// WebSocket tick payload
export interface TickPayload {
    tick: number;
    signals: SignalTick[];
    mode: 'MANUAL' | 'ADAPTIVE';
}

export interface SignalTick {
    signalId: number;
    name: string;
    state: 'GREEN' | 'YELLOW' | 'RED';
    timeRemaining: number;
    queueLength: number;
    avgWaitTime: number;
    utilization: number;
    arrivalRate: number;
}

// Simulation status
export interface SimulationStatus {
    running: boolean;
    currentTick: number;
}

// Queue history record
export interface QueueHistory {
    id: number;
    signal_id: number;
    timestamp: string;
    queue_length: number;
    avg_wait_time: number;
    utilization: number;
    arrival_rate: number;
}
```

---

## 3. Pages & Views

### 3.1 Dashboard (`/` — `app/page.tsx`)

The main page — a live intersection view showing real-time signal states, queue bars, and metrics.

**Layout:**

```
┌──────────────────────────────────────────────────────────┐
│  Navbar: [Dashboard] [History] [Config] [Analytics]      │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐            │
│  │  Signal 1  │  │  Signal 2  │  │  Signal N  │  ...      │
│  │  🔴 / 🟢   │  │  🔴 / 🟢   │  │  🔴 / 🟢   │            │
│  │  Timer: 18 │  │  Timer: 5  │  │  Timer: 22 │            │
│  │  ▓▓▓▓░░░░  │  │  ▓▓░░░░░░  │  │  ▓▓▓▓▓▓░░  │  Queue bars│
│  └───────────┘  └───────────┘  └───────────┘            │
│                                                          │
│  ┌── Live Metrics ──────────────────────────────┐        │
│  │  λ = 0.6    μ = 0.8    ρ = 0.75              │        │
│  │  Lq = 2.25  Wq = 3.75s  Utilization = 75%   │        │
│  └──────────────────────────────────────────────┘        │
│                                                          │
│  ┌── Queue Length Chart (scrolling 60s) ─────────┐       │
│  │  📈 Chart.js line chart                       │       │
│  └───────────────────────────────────────────────┘       │
│                                                          │
│  ┌── Control Panel ─────────────────────────────┐        │
│  │  [▶ Start] [⏹ Stop] [↺ Reset]               │        │
│  │  Arrival Rate (λ): ──●──────── 0.6           │        │
│  │  Speed: [1x] [5x] [10x]                     │        │
│  │  Mode: [Manual ○ | ● Adaptive]              │        │
│  └──────────────────────────────────────────────┘        │
└──────────────────────────────────────────────────────────┘
```

**Components used:** `SignalLight`, `QueueBar`, `LiveMetrics`, `QueueChart`, `ControlPanel`, `ModeToggle`, `SpeedControl`

### 3.2 History (`/history` — `app/history/page.tsx`)

Historical analysis of queue lengths and wait times.

- **HistoryChart** — Displays Chart.js bar/line charts from `/api/history`
- **HistoryFilters** — Dropdown to select signal, time range slider
- Fetches data from `GET /api/history?signal_id=&limit=`

### 3.3 Configuration (`/config` — `app/config/page.tsx`)

Add and edit traffic signals.

- **SignalList** — Table showing all signals with edit/delete buttons
- **SignalForm** — Form to create new signal or edit existing (name, green_duration, red_duration)
- Uses `POST /api/signals` and `PUT /api/signals/:id`

### 3.4 Analytics (`/analytics` — `app/analytics/page.tsx`)

Performance metrics and statistics.

- **UtilizationGauge** — Donut/gauge chart showing system utilization per signal
- **ThroughputTable** — Table with throughput stats, peak times, averages
- Fetches from `GET /api/signals/:id/stats`

---

## 4. Key Components

### 4.1 Signal Light Widget (`components/dashboard/SignalLight.tsx`)

An animated CSS circle representing a traffic light, with countdown timer.

| Feature | Implementation |
|---|---|
| **3 circles** | Stacked vertically: Red, Yellow, Green |
| **Active state** | CSS glow + brightness on the active circle |
| **Inactive state** | Dimmed/grayed out |
| **Countdown** | Numeric text below the light showing `timeRemaining` |
| **Animation** | CSS `transition` for smooth color changes; pulse animation on active |

**CSS approach:**
```css
.signal-circle {
    width: 60px; height: 60px;
    border-radius: 50%;
    transition: all 0.3s ease;
}
.signal-circle.active.red    { background: #ff3333; box-shadow: 0 0 20px #ff3333; }
.signal-circle.active.yellow { background: #ffcc00; box-shadow: 0 0 20px #ffcc00; }
.signal-circle.active.green  { background: #33cc33; box-shadow: 0 0 20px #33cc33; }
.signal-circle.inactive      { background: #333; opacity: 0.3; }
```

### 4.2 Queue Bar (`components/dashboard/QueueBar.tsx`)

Horizontal bar that grows as vehicles accumulate.

| Feature | Implementation |
|---|---|
| **Width** | Proportional to `queueLength` (max width at threshold) |
| **Color** | Green (low) → Yellow (medium) → Red (high severity) |
| **Label** | Shows queue count number inside the bar |
| **Animation** | CSS `width` transition for smooth growth/shrink |

### 4.3 Queue Chart (`components/dashboard/QueueChart.tsx`)

Scrolling Chart.js line chart showing the last 60 seconds of queue data.

| Feature | Implementation |
|---|---|
| **Library** | `chart.js` + `react-chartjs-2` |
| **Data buffer** | Maintain an array of last 60 data points |
| **Update** | Push new data on each WebSocket tick, shift oldest off |
| **Y-axis** | Queue length |
| **X-axis** | Tick number / time |
| **Multi-line** | One line per signal (different colors) |

### 4.4 Control Panel (`components/dashboard/ControlPanel.tsx`)

| Control | API Call | UI Element |
|---|---|---|
| Start | `POST /api/simulation/start` | Button (green) |
| Stop | `POST /api/simulation/stop` | Button (red) |
| Reset | `POST /api/simulation/reset` | Button (gray) |
| Arrival Rate (λ) | Sent with start or separate endpoint | Range slider |

### 4.5 Utilization Gauge (`components/analytics/UtilizationGauge.tsx`)

Donut chart showing utilization percentage (ρ × 100%).

| Feature | Implementation |
|---|---|
| **Library** | Chart.js doughnut chart |
| **Center text** | Show percentage number in the center |
| **Color** | Green (< 60%), Yellow (60-80%), Red (> 80%) |
| **Warning** | Flash red if ρ ≥ 1 (unstable system) |

---

## 5. Custom Hooks

### 5.1 `useSocket` Hook

```ts
// Manages WebSocket connection lifecycle
// Returns: { data: TickPayload | null, connected: boolean }
// - Connects to ws://backend:3001 on mount
// - Listens for 'tick-update' events
// - Cleans up on unmount
```

### 5.2 `useSimulation` Hook

```ts
// Manages simulation state and controls
// Returns: { status, start(), stop(), reset(), setSpeed(), setMode() }
// - Wraps REST API calls for simulation control
// - Tracks running/stopped state
```

### 5.3 `useSignals` Hook

```ts
// CRUD operations for signals
// Returns: { signals, createSignal(), updateSignal(), loading, error }
// - Fetches signals on mount
// - Provides mutation functions
```

---

## 6. API Integration (`src/lib/api.ts`)

```ts
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Wrapper functions
export const api = {
    // Signals
    getSignals:    () => fetch(`${API_BASE}/api/signals`),
    createSignal:  (data) => fetch(`${API_BASE}/api/signals`, { method: 'POST', body: ... }),
    updateSignal:  (id, data) => fetch(`${API_BASE}/api/signals/${id}`, { method: 'PUT', body: ... }),
    getSignalStats:(id) => fetch(`${API_BASE}/api/signals/${id}/stats`),

    // Simulation
    startSimulation:  (opts) => fetch(`${API_BASE}/api/simulation/start`, { method: 'POST', body: ... }),
    stopSimulation:   () => fetch(`${API_BASE}/api/simulation/stop`, { method: 'POST' }),
    resetSimulation:  () => fetch(`${API_BASE}/api/simulation/reset`, { method: 'POST' }),
    getSimStatus:     () => fetch(`${API_BASE}/api/simulation/status`),

    // History
    getHistory: (signalId, limit) => fetch(`${API_BASE}/api/history?signal_id=${signalId}&limit=${limit}`),
};
```

---

## 7. Design System & Styling

### 7.1 Color Palette

| Token | Value | Usage |
|---|---|---|
| `--bg-primary` | `#0f1117` | Dark background |
| `--bg-card` | `#1a1d27` | Card/panel background |
| `--bg-card-hover` | `#22263a` | Card hover state |
| `--text-primary` | `#e8eaed` | Primary text |
| `--text-secondary` | `#9aa0a6` | Secondary/muted text |
| `--accent-green` | `#34d399` | Green signal / success |
| `--accent-yellow` | `#fbbf24` | Yellow signal / warning |
| `--accent-red` | `#ef4444` | Red signal / danger |
| `--accent-blue` | `#60a5fa` | Interactive elements |
| `--border` | `#2d3142` | Subtle borders |

### 7.2 Typography

- **Font:** `Inter` from Google Fonts (loaded via Next.js font optimization)
- **Headings:** 600 weight, tracking -0.02em
- **Body:** 400 weight, 1rem / 1.5 line-height
- **Mono (metrics):** `JetBrains Mono` for numbers and code

### 7.3 Design Patterns

| Pattern | Implementation |
|---|---|
| **Dark Mode** | Default dark theme — sleek, modern |
| **Glassmorphism** | Subtle `backdrop-filter: blur()` on cards |
| **Glow effects** | Active signal lights with `box-shadow` glow |
| **Micro-animations** | Hover effects on buttons, smooth chart transitions |
| **Responsive** | CSS Grid for dashboard layout; flex for smaller screens |

---

## 8. Phased Implementation Schedule

### Phase 1: Project Setup & Layout (Days 1–2)

- [ ] Initialize Next.js project with TypeScript (`npx create-next-app@latest`)
- [ ] Install dependencies: `chart.js`, `react-chartjs-2`, `socket.io-client`
- [ ] Set up `globals.css` with design tokens and dark theme
- [ ] Configure `next.config.ts` for backend API proxy / env vars
- [ ] Create `src/types/index.ts` with all TypeScript interfaces
- [ ] Build `Navbar.tsx` — tabs for 4 pages with active state
- [ ] Build `layout.tsx` — load Inter font, apply global styles
- [ ] Create `src/lib/api.ts` — fetch wrapper for all endpoints
- [ ] Create `src/lib/socket.ts` — Socket.io client singleton
- [ ] Set `.env.local` with `NEXT_PUBLIC_API_URL=http://localhost:3001`

### Phase 2: Dashboard — Signal Widgets & Controls (Days 3–5)

- [ ] Build `SignalLight.tsx` — animated traffic light with CSS glow
- [ ] Build `QueueBar.tsx` — severity-colored horizontal bar
- [ ] Build `LiveMetrics.tsx` — λ, μ, ρ, Lq, Wq display panel
- [ ] Build `ControlPanel.tsx` — Start/Stop/Reset buttons + λ slider
- [ ] Build `ModeToggle.tsx` — Manual vs Adaptive switch
- [ ] Build `SpeedControl.tsx` — 1x/5x/10x speed buttons
- [ ] Create `useSocket.ts` hook — WebSocket connection + data state
- [ ] Create `useSimulation.ts` hook — simulation control state
- [ ] Assemble Dashboard page (`app/page.tsx`) with all components
- [ ] Test WebSocket data flow from backend → dashboard

### Phase 3: Dashboard — Charts (Days 6–7)

- [ ] Build `QueueChart.tsx` — scrolling line chart (last 60 data points)
- [ ] Multi-line support (one line per signal, different colors)
- [ ] Smooth data push/shift animation
- [ ] Integrate chart into Dashboard page
- [ ] Test with live simulation data

### Phase 4: Configuration Page (Days 8–9)

- [ ] Build `SignalForm.tsx` — create/edit signal form
- [ ] Build `SignalList.tsx` — table of signals with edit/delete
- [ ] Create `useSignals.ts` hook — CRUD state management
- [ ] Assemble Config page (`app/config/page.tsx`)
- [ ] Test signal creation and updates via the form

### Phase 5: History Page (Days 10–11)

- [ ] Build `HistoryChart.tsx` — Chart.js bar/line charts for historical data
- [ ] Build `HistoryFilters.tsx` — signal dropdown + time range
- [ ] Assemble History page (`app/history/page.tsx`)
- [ ] Test data fetching from `/api/history` endpoint

### Phase 6: Analytics Page (Days 12–13)

- [ ] Build `UtilizationGauge.tsx` — donut chart with center percentage
- [ ] Build `ThroughputTable.tsx` — throughput statistics table
- [ ] Assemble Analytics page (`app/analytics/page.tsx`)
- [ ] Test stats display from `/api/signals/:id/stats`

### Phase 7: Polish & Responsive Design (Days 14–15)

- [ ] Consistent styling across all 4 pages
- [ ] Add hover effects and micro-animations to all interactive elements
- [ ] Responsive layout — dashboard adapts to tablet/mobile
- [ ] ρ ≥ 1 warning banner on dashboard (unstable system alert)
- [ ] Loading states and error states for all data-fetching components
- [ ] Connection status indicator (WebSocket connected/disconnected)
- [ ] Final cross-browser testing

---

## 9. Dependencies

```json
{
    "dependencies": {
        "next": "^15.x",
        "react": "^19.x",
        "react-dom": "^19.x",
        "chart.js": "^4.x",
        "react-chartjs-2": "^5.x",
        "socket.io-client": "^4.7.x"
    },
    "devDependencies": {
        "typescript": "^5.x",
        "@types/react": "^19.x",
        "@types/react-dom": "^19.x",
        "@types/node": "^22.x"
    }
}
```

---

## 10. Environment Variables (`.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=http://localhost:3001
```

---

## 11. Key Design Decisions

| Decision | Rationale |
|---|---|
| **Next.js App Router** | File-based routing, server components, optimized builds |
| **Client components for dashboard** | WebSocket + Chart.js require browser APIs |
| **Custom hooks** | Clean separation of data logic from UI components |
| **Chart.js** | Lightweight, well-documented charting — no need for heavier D3.js |
| **Socket.io-client** | Matches backend Socket.io; auto-reconnection for free |
| **CSS (no Tailwind)** | Maximum control, custom dark theme, glassmorphism effects |
| **Dark theme default** | Professional look for a monitoring/simulation dashboard |

---

## 12. Common Pitfalls to Avoid

- ❌ Not cleaning up WebSocket listeners on component unmount → memory leaks
- ❌ Updating Chart.js data by replacing the entire dataset → destroys animations; mutate in-place instead
- ❌ Missing `"use client"` directive on components using hooks/state → Next.js SSR errors
- ❌ Not debouncing the arrival rate slider → floods the backend with API calls
- ❌ Forgetting to handle disconnected WebSocket state → stale dashboard data
- ❌ Not showing loading/error states → users see blank pages while data loads
