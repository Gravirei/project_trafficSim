# HANDOFF: Ops Dashboard — Greenwave Traffic Simulation

## What to build

After a successful login, the app should redirect the operator to an **Ops Dashboard** at `/dashboard`. This is the "post-auth landing page" that gives a live overview of the entire traffic network — not a single junction desk.

The reference design is in **`frontend/traffic(1).html`** (the single-file prototype). After sign-in, `doLogin()` calls `showDashboard()` which renders the `#dashboard` div. Study those sections carefully.

---

## Reference snapshot (from traffic.html)

### HTML structure (lines 544–635)

```
#dashboard
  header.topbar
    button "BRIEFING" → showLanding()
    span "GREENWAVE · OPS DASHBOARD"
    span.mode-chip "FLEET 5/5 ONLINE"
    div.tb-search input#dashSearch
    div.tb-right
      div#alertChip (NO ALERTS / N ALERTS · N CRIT)
      button "FULL MAP" → showMap()
      span#dashClock clock
      button "SIGN OUT" → doLogout()
  main.dashwrap (grid: 260px 1fr 320px)
    div.dashcol-l
      div.panel — OPERATOR
        .avatar#avatarInit + .pinfo (.pName, .prole)
        .blk .meta — SHIFT, STATION, SIGNED IN
      div.panel — NETWORK KPIs
        .stats-grid#dashStats (4 KPIs)
        canvas#uptimeSpark (30-day sparkline)
        .spark-cap "UPTIME · LAST 30 DAYS"
      div.panel — TODAY
        .blk .meta "PREEMPTIONS TODAY / ALARMS OPENED / SHIFT COVERAGE"
    div.dashcol-c
      div.panel — LIVE CITY MAP
        .minimap-stage
          svg#miniMap (viewBox 20 0 1800 1480)
          .minimap-legend (ONLINE / DEGRADED / OFFLINE)
      div.panel — FLEET HEALTH
        .fseg#fleetFilter [ALL / ISSUES]
        table.fleet-table
          thead: SITE / DISTRICT / COMMS / POWER / DETECTORS / FIRMWARE
          tbody#fleetBody — rows per junction
    div.dashcol-r
      div.panel — ALERTS
        .fseg#alertFilter [ALL / CRIT / WARN / INFO]
        .blk.alertlist-blk
          div#alertList (aitem divs with ack buttons)
```

### CSS key rules (lines 204–295)

- `.dashboard` = `height:100vh; flex-direction:column; background:var(--bg3)`
- `.dashwrap` = `flex:1; overflow-y:auto; display:grid; grid-template-columns:260px 1fr 320px; gap:12px; padding:12px`
- `.dashcol` = `display:flex; flex-direction:column; min-height:0; gap:12px`
- `.profileblk` = `display:flex; gap:12px; align-items:center`
- `.avatar` = 46×46 amber-bordered square with initials
- `.pName` = `font-weight:800; text-transform:uppercase; font-family:var(--disp)`
- `.alertchip` = amber/red bordered pill, hides clear when `alertchip.clear`
- `.minimap-stage` = `position:relative; flex:1; min-height:280px; background:#0d0e10`
- `.miniMap` = `position:absolute; inset:0` SVG
- `.mmRoad` = `stroke:#22262d; stroke-width:15; fill:none`
- `.mmRoadThin` = `stroke-width:8`
- `.mmPin:hover circle.ring` = `stroke:var(--amber)`
- `.fleetTable` = monospace, 10px
- `.aitem` = `border-left:3px solid` (color by severity), pulses red animation if critical+unack
- `.aitem .aack` = acknowledge button

### JS (DASH IIFE, lines 1963–2149)

The prototype uses a module-level `DASH` IIFE that manages:
- `FLEET` object keyed by junction id (cross/round/y/t/penta) with comms/power/detFaults/firmware/checkin
- `ALERTS` array with id/severity/junc/t(ago)/ack/txt
- `UPTIME` array of 30 numbers for sparkline
- `ROADS_MINI` / `THIN_MINI` polyline data for SVG minimap
- `fmtAgo(sec)` → human-readable age
- `juncLevel(id)` → 0/1/2 from fleet+alerts
- `buildProfile()` / `buildStats()` / `drawUptimeSpark()` / `buildMiniMap()` / `buildFleet()` / `buildAlerts()` / `ack(id)`
- `tick(dt)` → updates clock every frame, refreshes alerts/stats every 2s
- `show()` → initial render + lucide.createIcons()

---

## Your implementation plan

### 1. File layout

Create these files (do NOT use bare CSS globals — CSS Modules only):

```
frontend/src/views/dashboard/
  DashboardView.tsx       — main component (client, 'use client')
  dashboard.module.css    — ALL dashboard styles (CSS Modules)

frontend/src/app/dashboard/
  page.tsx               — route: <RequireAuth><DashboardView /></RequireAuth>
```

### 2. CSS Modules approach

- Every class used in JSX must be imported from a CSS Module (`import s from './dashboard.module.css'`)
- Use `className={s.foo}` not `className="foo"`
- Shared global classes like `panel`, `blk`, `ph`, `meta`, `statsGrid`, `sg`, `hint`, `topbar`, `tbBtn`, `tbTitle`, `modeChip`, `tbRight`, `clock` come from existing CSS Module files — import them from the respective components' `.module.css` files and spread onto wrapper elements
- OR: add new dashboard-specific global CSS to `app/globals.css` for layout-only classes (`.dashboard`, `.dashwrap`, `.dashcol`) since CSS Modules can't be composed from globals
- The safest pattern: layout shell classes (`dashboard`, `dashWrap`, `dashCol`, `dashColC`, `dashColR`) go in a module; wrapper components (`Panel`, `PanelHeader`, `Block`) are used as-is from their existing module CSS imports

### 3. Extend routing

- Add `'dashboard'` to the `View` type in `lib/sim/router.ts`
- Add `showDashboard(): void` to `ViewManager` interface and implement it (set view to 'dashboard', hash to '#dashboard', navigate to '/dashboard')
- Add `showDashboard` to `ViewCtx` in `hooks/useViewController.tsx` and wire it through `useViewController()` hook
- Add `pathname.startsWith('/dashboard')` branch to `RootShell.tsx` that sets `document.body.dataset.view = 'dashboard'`

### 4. Login redirect

In `views/login/LoginView.tsx`, change the post-login redirect:
```ts
const next = new URLSearchParams(window.location.search).get('next') ?? '/dashboard';
```

### 5. Dashboard data

The dashboard is a **read-only monitoring view** — all data is mock/local (no backend calls needed):

- `FLEET` and `ALERTS` are module-level `const` arrays (same data as the prototype)
- `UPTIME` is a `const number[]` of 30 daily percentages
- Junction list comes from `Object.values(JUNCS)` — imported from `@/lib/sim`
- Operator info comes from `useAuth()`: `user.username`, `user.email`
- Clock runs on `requestAnimationFrame` loop (increment a ref each frame, update state every ~100ms)

### 6. MiniMap SVG

- Render as an inline `<svg viewBox="20 0 1800 1480" preserveAspectRatio="xMidYMid meet">`
- Road polylines from `ROADS_MINI` / `THIN_MINI` const arrays
- One `<circle>` for the roundabout ring
- One `<g class="mmPin">` per junction: circle markers + text labels
- Junction color (green/yellow/red) from `juncLevel()` helper
- `onClick` on the group → `router.push('/desk/' + J.id)`
- Filter by search string: if no match, set group `opacity: 0.22`

### 7. Fleet table

- One row per junction from `Object.values(JUNCS)`
- Columns: SITE (code+name), DISTRICT, COMMS (colored dot), POWER (colored dot), DETECTORS, FIRMWARE, OPEN button
- `onClick` OPEN → `router.push('/desk/' + id)`
- ALL/ISSUES filter toggles rows

### 8. Alerts panel

- Filter by severity (ALL/CRIT/WARN/INFO)
- Sort: unack first, then by `t` ascending
- Acknowledge button toggles `a.ack` state (mutable — array lives in component)
- Critical unack items get a pulsing CSS animation
- Age shown with `fmtAgo()` using stable initial values (computed once on mount, not recalculated every frame)

### 9. Important CSS gotcha

CSS Modules **mangle every class selector**. This means:
- `className="panel"` in JSX will compile to `.panel_abc123` but look for `.panel` in CSS — **it will never match**
- Always use `import s from './module.css'` and `className={s.panel}`
- For global/shared class names (like `panel`, `blk`, `hint`) used inside a CSS Module component, you must either:
  - Use the `Panel`, `Block`, `Hint` React components from `@/components/ui/Panel` (they handle their own CSS Module scope), OR
  - Import the global module: `import panelStyles from '@/components/ui/Panel.module.css'` and use `panelStyles.panel`

### 10. Verify

After implementation:
- `npm run dev` starts without errors
- `npx tsc --noEmit` passes with zero errors
- Login at `/login` → redirect to `/dashboard`
- All 3 columns visible, minimap renders SVG, fleet table has rows, alerts panel shows items
- Clicking a junction pin on the minimap navigates to `/desk/<id>`
