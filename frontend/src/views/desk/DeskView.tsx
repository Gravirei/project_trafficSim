'use client';

import { Component, ErrorInfo, ReactNode, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useViewController } from '@/hooks/useViewController';
import { useLucideRefresh } from '@/hooks/useLucide';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import {
  JUNCS,
  SZ,
  fmtClock,
  HINTS,
  TAGN,
  buildPaths,
  buildStaticLayer,
  drawFrame,
  drawSparkline,
  startBootOverlay,
  bootLinesFor,
  step,
  makeVeh,
} from '@/lib/sim';
import { createSimSync, type SimSync } from '@/lib/sim/sync';
import { useAuth } from '@/components/auth/AuthProvider';
import { RequireAuth } from '@/components/auth/RequireAuth';
import type { SimState } from '@/lib/sim/types';
import { ControlPanel } from './ControlPanel';
import { Stage } from './Stage';
import { TelemetryPanel } from './TelemetryPanel';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import styles from './DeskView.module.css';
import './desk.css';
import { useTheme } from '@/hooks/useTheme';

class DeskErrorBoundary extends Component<{ children: ReactNode; onError: (e: Error) => void }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    // eslint-disable-next-line no-console
    console.error('[DeskErrorBoundary] caught', error);
    return { error };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error('[DeskView]', error, info);
  }
  render() {
    if (this.state.error) {
      return (
        <div id="control" style={{ padding: 24, color: '#e5484d', fontFamily: 'monospace' }}>
          <h2>Desk error</h2>
          <pre>{this.state.error?.message}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

/** Module-level cache so per-junction sim state survives route transitions. */
const simCache = new Map<string, SimState>();

function getOrCreateSim(id: string): SimState {
  let s = simCache.get(id);
  if (s) return s;
  const J = JUNCS[id];
  if (!J) throw new Error(`Unknown junction id: ${id}`);
  const { paths, mvMap } = buildPaths(J);
  s = {
    J,
    booted: false,
    night: false,
    paused: false,
    inited: true,
    G: { thru: 14, left: 7, yellow: 3, allred: 2, truck: 12, speed: 1, demand: J.legs.map((_, i) => [40, 35, 45, 30][i % 4]) },
    ctl: { mode: 'actuated', phase: 0, interval: 'G', t: 0, resting: false, pedPending: false, pedActive: false, pedSide: 0, pedDur: 8, preempt: null },
    vehs: [], peds: [], exits: [], vid: 1, simT: 0, sel: null, lastHud: 0,
    stats: { served: 0, waitSum: 0, waitMax: 0 }, logs: [],
    paths,
    mvMap,
  };
  simCache.set(id, s);
  return s;
}

export function DeskView(props: { id: string }) {
  return (
    <RequireAuth>
      <DeskErrorBoundary onError={() => {}}>
        <DeskViewInner {...props} />
      </DeskErrorBoundary>
    </RequireAuth>
  );
}

function DeskViewInner({ id }: { id: string }) {
  // NOTE: useLucideRefresh() intentionally omitted here — calling createIcons()
  // inside React's commit phase causes a Node.removeChild reconciliation error
  // on this view due to its complex DOM structure.
  const router = useRouter();
  const { showMap, showLanding } = useViewController();
  const { theme } = useTheme();
  const { api, socket } = useAuth();
  const syncRef = useRef<SimSync | null>(null);

  // Sync sim day/night to the global theme: dark = night, light = day.
  // Rebuild the static layer + log the transition when it changes.
  useEffect(() => {
    const Scur = SRef.current;
    if (!Scur) return;
    const wantNight = theme === 'dark';
    if (Scur.night === wantNight) return;
    Scur.night = wantNight;
    staticCvRef.current = buildStaticLayer(Scur);
    Scur.logs.unshift({
      t: fmtClock(7 * 3600 + Scur.simT),
      tag: 'sys',
      msg: wantNight ? 'AMBIENT → NIGHT' : 'AMBIENT → DAY',
    });
  }, [theme]);
  const cvRef = useRef<HTMLCanvasElement | null>(null);
  const sparkRef = useRef<HTMLCanvasElement | null>(null);
  const bootElRef = useRef<HTMLDivElement | null>(null);
  const bootTxtRef = useRef<HTMLPreElement | null>(null);
  const SRef = useRef<SimState | null>(null);
  const staticCvRef = useRef<HTMLCanvasElement | null>(null);

  // Initialize synchronously so first render has the sim ready (no "Initializing…" flash)
  try {
    if (!SRef.current || SRef.current.J.id !== id) {
      SRef.current = getOrCreateSim(id);
      syncRef.current?.destroy();
      syncRef.current = createSimSync(SRef.current, { api, socket });
    }
    if (typeof document !== 'undefined' && !staticCvRef.current) {
      staticCvRef.current = buildStaticLayer(SRef.current);
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[DeskView] init error', err);
  }
  const S = SRef.current;

  // Tear down the sync on unmount.
  useEffect(() => {
    return () => {
      syncRef.current?.destroy();
      syncRef.current = null;
    };
  }, []);

  // Phase 7: cold-reload backfill. If the sim is fresh (simT === 0 and
  // no local logs), pull recent events from the backend so the desk UI
  // isn't empty after a hard refresh of a running junction.
  useEffect(() => {
    if (!S) return;
    if (S.simT !== 0) return;
    let cancelled = false;
    (async () => {
      try {
        if (S.logs.length === 0) {
          const events = await api.getEvents(S.J.id, 0, 70);
          if (cancelled || S.simT !== 0) return;
          for (const e of events.slice(-70)) {
            S.logs.unshift({
              t: new Date(e.recorded_at).toISOString().slice(11, 19),
              tag: e.tag,
              msg: e.msg,
            });
          }
        }
      } catch (err) {
        // Best-effort; fall back to local sim.
        // eslint-disable-next-line no-console
        console.warn('[backfill] events failed', err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [S, api]);

  // Build phase segments, queue rows, demand sliders
  useEffect(() => {
    if (!S) return;
    const strip = document.getElementById('strip');
    if (strip) {
      strip.innerHTML = '';
      S.J.phases.forEach((ph, i) => {
        const d = document.createElement('div');
        d.className = 'pseg';
        d.innerHTML = `<span class="pn">P${i + 1}</span><div class="pl">${ph.short}</div><div class="tr"><i></i></div>`;
        d.onclick = () => {
          if (S.ctl.preempt) {
            showToast('PREEMPTION ACTIVE');
            return;
          }
          S.ctl.phase = i;
          S.ctl.interval = 'G';
          S.ctl.t = 0;
          S.ctl.resting = false;
          S.logs.unshift({ t: fmtClock(7 * 3600 + S.simT), tag: 'sys', msg: 'OPERATOR OVERRIDE — FORCE PHASE ' + (i + 1) });
          if (S.logs.length > 70) S.logs.pop();
          void syncRef.current?.notifyCommand('force-phase', { phase: i });
        };
        strip.appendChild(d);
      });
    }
    const qb = document.getElementById('queues');
    if (qb) {
      qb.innerHTML = '';
      S.J.legs.forEach((a, k) => {
        const d = document.createElement('div');
        d.className = 'qrow';
        d.dataset.k = String(k);
        d.innerHTML = `<span class="ql">${S.J.legNames[k]} ▸</span><div class="qt"><i></i></div><span class="qc">0</span>`;
        qb.appendChild(d);
      });
    }
    const db = document.getElementById('demandBlk');
    if (db) {
      db.innerHTML = '';
      S.J.legs.forEach((a, k) => {
        const d = document.createElement('div');
        d.className = 'sl';
        d.innerHTML = `<label>${S.J.legNames[k]} APPROACH <b id="v-d${k}">${S.G.demand[k]}</b></label><input type="range" id="d-${k}" min="0" max="100" value="${S.G.demand[k]}">`;
        const inp = d.querySelector('input') as HTMLInputElement;
        inp.addEventListener('input', () => {
          S.G.demand[k] = +inp.value;
          const v = document.getElementById('v-d' + k);
          if (v) v.textContent = inp.value;
        });
        db.appendChild(d);
      });
    }
    const pg = document.getElementById('pevGrid');
    if (pg) {
      pg.innerHTML = '';
      pg.className = 'pev-grid' + (S.J.legs.length === 3 ? ' t3' : '');
      S.J.legs.forEach((a, k) => {
        const b = document.createElement('button');
        b.className = 'pev';
        b.textContent = S.J.legNames[k];
        b.title = 'Preempt for ' + S.J.legFull[k];
        b.onclick = () => preemptForLeg(k);
        pg.appendChild(b);
      });
    }
    document.getElementById('modeChip')!.textContent = S.ctl.mode.toUpperCase();
    document.getElementById('modeHint')!.textContent = HINTS[S.ctl.mode];
    document.getElementById('juncTitle')!.innerHTML = `GREENWAVE · <b>${S.J.code}</b> · ${S.J.name} CONTROL DESK`;
  }, [S]);

  // Bind buttons & keyboard & boot
  useEffect(() => {
    if (!S) return;
    const bind = (id: string, fn: () => void) => {
      const el = document.getElementById(id);
      if (el) el.onclick = fn;
    };
    bind('btnAdvance', () => {
      if (S.ctl.preempt) {
        showToast('PREEMPTION ACTIVE');
        return;
      }
      if (S.ctl.interval === 'G') {
        S.ctl.interval = 'Y';
        S.ctl.t = 0;
        S.logs.unshift({
          t: fmtClock(7 * 3600 + S.simT),
          tag: 'sys',
          msg: 'MANUAL ADVANCE — PHASE ' + (S.ctl.phase + 1) + ' TERMINATED',
        });
      } else if (S.ctl.interval === 'WALK') {
        S.ctl.phase = (S.ctl.phase + 1) % S.J.phases.length;
        S.ctl.interval = 'G';
        S.ctl.t = 0;
      } else if (S.ctl.interval === 'Y') {
        S.ctl.t = S.G.yellow;
      } else {
        S.ctl.t = 1e9;
      }
    });
    bind('btnPed', () => {
      if (S.ctl.pedPending || S.ctl.interval === 'WALK') {
        showToast('PED CALL ALREADY PENDING');
        return;
      }
      S.ctl.pedPending = true;
      S.ctl.pedSide = (Math.random() * S.J.legs.length) | 0;
      S.logs.unshift({
        t: fmtClock(7 * 3600 + S.simT),
        tag: 'ped',
        msg: 'PEDESTRIAN CALL — ' + S.J.legNames[S.ctl.pedSide] + ' LEG',
      });
      showToast('PED CALL REGISTERED');
    });
    bind('btnPause', () => togglePause());
    bind('btnReset', () => resetSim());
    bind('btnMap', () => router.push('/map'));
    const seg = document.getElementById('segMode');
    if (seg) {
      seg.querySelectorAll('button').forEach((b) => {
        b.classList.toggle('on', (b as HTMLElement).dataset.m === S.ctl.mode);
        b.addEventListener('click', () => {
          const m = (b as HTMLElement).dataset.m as 'fixed' | 'actuated' | 'manual';
          S.ctl.mode = m;
          void syncRef.current?.notifyCommand('set-mode', { mode: m });
          seg.querySelectorAll('button').forEach((x) => x.classList.remove('on'));
          b.classList.add('on');
          const chip = document.getElementById('modeChip');
          if (chip) chip.textContent = m.toUpperCase();
          const hint = document.getElementById('modeHint');
          if (hint) hint.textContent = HINTS[m];
          S.logs.unshift({
            t: fmtClock(7 * 3600 + S.simT),
            tag: 'mode',
            msg: 'CONTROL MODE → ' + m.toUpperCase(),
          });
        });
      });
    }
    const spd = document.getElementById('spd');
    if (spd) {
      const syncSpd = () => {
        spd.querySelectorAll('button').forEach((b) => {
          const active = +((b as HTMLElement).dataset.s || 1) === S.G.speed;
          if (active) b.setAttribute('data-active', 'true');
          else b.removeAttribute('data-active');
        });
      };
      syncSpd();
      spd.querySelectorAll('button').forEach((b) => {
        b.addEventListener('click', () => {
          S.G.speed = +((b as HTMLElement).dataset.s || 1);
          syncSpd();
        });
      });
    }
    const bindRange = (
      rid: string,
      vid: string,
      fmt: (v: number) => string,
      set: (v: number) => void,
      name: string,
    ) => {
      const el = document.getElementById(rid) as HTMLInputElement | null;
      const v = document.getElementById(vid);
      if (!el || !v) return;
      el.oninput = () => {
        const val = +el.value;
        v.textContent = fmt(val);
        set(val);
      };
      el.onchange = () =>
        S.logs.unshift({
          t: fmtClock(7 * 3600 + S.simT),
          tag: 'sys',
          msg: name + ' SET TO ' + fmt(+el.value).toUpperCase(),
        });
    };
    bindRange('s-thru', 'v-thru', (v) => String(v), (v) => { S.G.thru = v; }, 'THROUGH GREEN');
    bindRange('s-left', 'v-left', (v) => String(v), (v) => { S.G.left = v; }, 'LEFT GREEN');
    bindRange('s-yel', 'v-yel', (v) => v.toFixed(1), (v) => { S.G.yellow = v; }, 'YELLOW');
    bindRange('s-ar', 'v-ar', (v) => v.toFixed(1), (v) => { S.G.allred = v; }, 'ALL-RED');
    bindRange('s-trk', 'v-trk', (v) => String(v), (v) => { S.G.truck = v; }, 'TRUCK SHARE');
    document.getElementById('inspClose')?.addEventListener('click', () => selectVeh(null));
    const cv = cvRef.current;
    if (cv) {
      cv.onclick = (e) => {
        const r = cv.getBoundingClientRect();
        const sc = SZ / r.width;
        const x = (e.clientX - r.left) * sc;
        const y = (e.clientY - r.top) * sc;
        let best: any = null;
        let bd = 500;
        for (const v of S.vehs) {
          const dx = v.x - x;
          const dy = v.y - y;
          const d = dx * dx + dy * dy;
          if (d < bd) {
            bd = d;
            best = v;
          }
        }
        selectVeh(best);
      };
    }
    if (bootElRef.current && bootTxtRef.current && !S.booted) {
      const cancel = startBootOverlay({
        text: bootTxtRef.current,
        onDone: () => {
          S.booted = true;
          S.logs.unshift({
            t: fmtClock(7 * 3600 + S.simT),
            tag: 'sys',
            msg: S.J.code + ' ONLINE — ' + S.ctl.mode.toUpperCase() + ' MODE',
          });
          S.logs.unshift({
            t: fmtClock(7 * 3600 + S.simT),
            tag: 'sys',
            msg: 'RING · ' + S.J.phases.map((p, i) => 'P' + (i + 1) + ' ' + p.short).join(' · '),
          });
          showToast(S.J.code + ' ONLINE');
          fit();
          if (bootElRef.current) bootElRef.current.style.display = 'none';
        },
        lines: bootLinesFor(S.J),
      });
      bootElRef.current.onclick = () => {
        cancel();
        S.booted = true;
        if (bootElRef.current) bootElRef.current.style.display = 'none';
      };
    }
  }, [S]);

  // Main rAF loop — paints canvas, runs sim, updates HUD DOM directly.
  // No setRerender here: the canvas is its own visual surface, and the
  // HUD elements are mutated directly (no React re-render needed).
  useEffect(() => {
    if (!S) return;
    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (S.booted && !S.paused) {
        const real = dt * S.G.speed;
        const m = Math.max(1, Math.ceil(real / 0.035));
        const h = real / m;
        for (let i = 0; i < m; i++) step(S, h);
      }
      if (cvRef.current) {
        const ctx = cvRef.current.getContext('2d');
        if (ctx && staticCvRef.current) drawFrame(ctx, staticCvRef.current, S, 1);
      }
      if (sparkRef.current) {
        const ctx = sparkRef.current.getContext('2d');
        if (ctx) drawSparkline(ctx, S);
      }
      if (now - S.lastHud > 110) {
        S.lastHud = now;
        updateHudOnDom(S);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useKeyboardShortcuts(
    {
      onSpace: () => togglePause(),
      onDigit: (d) => {
        const cur = SRef.current;
        if (!cur) return;
        if (cur.ctl.preempt) {
          showToast('PREEMPTION ACTIVE');
          return;
        }
        if (d - 1 < cur.J.phases.length) {
          cur.ctl.phase = d - 1;
          cur.ctl.interval = 'G';
          cur.ctl.t = 0;
          cur.ctl.resting = false;
        }
      },
    },
    !!S,
  );

  function togglePause() {
    if (!S) return;
    S.paused = !S.paused;
    const ip = document.getElementById('icPause');
    const iy = document.getElementById('icPlay');
    const chip = document.getElementById('pausedChip');
    if (ip) ip.classList.toggle('hide', S.paused);
    if (iy) iy.classList.toggle('hide', !S.paused);
    if (chip) chip.classList.toggle('hide', !S.paused);
  }
  function resetSim() {
    if (!S) return;
    S.vehs = [];
    S.peds = [];
    S.exits = [];
    S.simT = 0;
    S.vid = 1;
    S.sel = null;
    S.stats = { served: 0, waitSum: 0, waitMax: 0 };
    S.logs = [];
    Object.assign(S.ctl, {
      phase: 0,
      interval: 'G',
      t: 0,
      resting: false,
      pedPending: false,
      pedActive: false,
      preempt: null,
    });
    document.getElementById('log')!.innerHTML = '';
    S.logs.unshift({
      t: fmtClock(7 * 3600 + S.simT),
      tag: 'sys',
      msg: 'SIMULATION RESET — CLOCK 07:00:00',
    });
    showToast('SIMULATION RESET');
    void syncRef.current?.notifyCommand('reset');
  }
  function preemptForLeg(k: number) {
    if (!S) return;
    if (S.ctl.preempt) {
      showToast('PREEMPTION ALREADY ACTIVE');
      return;
    }
    const p = S.mvMap[k].T || S.mvMap[k].L || (Object.values(S.mvMap[k])[0] as any);
    if (!p) return;
    for (const u of S.vehs) {
      if (u.laneId === (p as any).laneId && u.s < 95) {
        showToast('APPROACH OCCUPIED — TRY AGAIN');
        return;
      }
    }
    const v = makeVeh(S, k, p.legB, p.mv, 'EV');
    S.vehs.push(v);
    S.ctl.preempt = { k, evId: v.id };
    S.logs.unshift({
      t: fmtClock(7 * 3600 + S.simT),
      tag: 'ev',
      msg: 'PREEMPTION — EMERGENCY VEHICLE ON ' + S.J.legFull[k],
    });
    showToast('PREEMPT · ' + S.J.legNames[k] + ' APPROACH');
    void syncRef.current?.notifyCommand('preempt', { leg: k });
  }
  function selectVeh(v: any) {
    if (!S) return;
    S.sel = v;
    const insp = document.getElementById('insp');
    if (insp) insp.classList.toggle('hide', !v);
    if (v) {
      const tag = document.getElementById('iTag');
      const type = document.getElementById('iType');
      const route = document.getElementById('iRoute');
      if (tag) tag.textContent = '#' + String(v.id).padStart(3, '0');
      if (type) type.textContent = v.type === 'EV' ? 'EMERGENCY' : v.type.toUpperCase();
      if (route) route.textContent = S.J.legNames[v.path.legA] + ' ▸ ' + S.J.legNames[v.path.legB];
    }
  }
  function fit() {
    if (!S || !cvRef.current) return;
    const r = cvRef.current.getBoundingClientRect();
    const s = Math.max(280, Math.min(r.width - 16, r.height - 16));
    cvRef.current.style.width = s + 'px';
    cvRef.current.style.height = s + 'px';
  }
  function showToast(msg: string) {
    const t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 1900);
  }
  function updateHudOnDom(s: SimState) {
    const clock = document.getElementById('clock');
    if (clock) clock.textContent = fmtClock(7 * 3600 + s.simT);
    const phName = document.getElementById('phName');
    const ph = s.J.phases[s.ctl.phase];
    if (phName) phName.textContent = 'PHASE ' + (s.ctl.phase + 1) + ' — ' + ph.name;
    const intvMap: Record<string, [string, string]> = {
      G: ['GREEN', 'cG'],
      Y: ['YELLOW', 'cY'],
      R: ['ALL-RED', 'cR'],
      WALK: ['WALK', 'cP'],
    };
    let [txt, cls] = intvMap[s.ctl.interval];
    if (s.ctl.interval === 'G' && s.ctl.preempt) txt = 'PREEMPT';
    if (s.ctl.interval === 'G' && s.ctl.resting) txt = 'REST';
    const hudInt = document.getElementById('hudInt');
    if (hudInt) {
      hudInt.textContent = txt;
      hudInt.className = 'chip ' + cls;
    }
    const hudPhase = document.getElementById('hudPhase');
    if (hudPhase) hudPhase.textContent = 'PHASE ' + (s.ctl.phase + 1) + ' · ' + ph.name;
    const dur =
      s.ctl.interval === 'G'
        ? ph.dur === 'thru' ? s.G.thru : s.G.left
        : s.ctl.interval === 'Y' ? s.G.yellow
        : s.ctl.interval === 'R' ? s.G.allred : s.ctl.pedDur;
    document.querySelectorAll('#strip .pseg').forEach((el, i) => {
      const e = el as HTMLElement;
      e.classList.toggle('on', i === s.ctl.phase);
      const fill = e.querySelector('.tr i') as HTMLElement | null;
      if (fill) fill.style.width = (i === s.ctl.phase ? Math.max(0, Math.min(1, s.ctl.t / dur)) * 100 : 0) + '%';
    });
    const phInt = document.getElementById('phInt');
    const phRem = document.getElementById('phRem');
    const phNext = document.getElementById('phNext');
    const phServe = document.getElementById('phServe');
    if (phInt) phInt.textContent = txt;
    if (phRem)
      phRem.textContent =
        (s.ctl.preempt || s.ctl.resting) && s.ctl.interval === 'G' ? 'HOLD' : Math.max(0, dur - s.ctl.t).toFixed(1) + 's';
    if (phNext)
      phNext.textContent = s.ctl.preempt
        ? 'HOLD — EV CLEARANCE'
        : 'PHASE ' + (((s.ctl.phase + 1) % s.J.phases.length) + 1) + ' · ' + s.J.phases[(s.ctl.phase + 1) % s.J.phases.length].name;
    if (phServe)
      phServe.textContent = ph.moves
        .map((m) =>
          m[1] === '*'
            ? s.J.legNames[m[0]] + '▸ALL'
            : (() => {
                const p = s.mvMap[m[0]][m[1]];
                return s.J.legNames[m[0]] + '▸' + s.J.legNames[p.legB];
              })(),
        )
        .join('  ');
    document.querySelectorAll('#queues .qrow').forEach((el) => {
      const k = +(el as HTMLElement).dataset.k!;
      const qn = s.vehs.filter((v) => v.path.legA === k && v.s < v.path.stopS && v.v < 12).length;
      const fill = el.querySelector('.qt i') as HTMLElement | null;
      const cnt = el.querySelector('.qc') as HTMLElement | null;
      if (fill) fill.style.width = Math.min(100, qn * 10) + '%';
      if (cnt) cnt.textContent = String(qn);
      el.classList.toggle('hi', qn >= 8);
    });
    const stServed = document.getElementById('stServed');
    const stFlow = document.getElementById('stFlow');
    const stAvg = document.getElementById('stAvg');
    const stMax = document.getElementById('stMax');
    if (stServed) stServed.textContent = String(s.stats.served);
    if (stFlow) stFlow.innerHTML = s.exits.filter((t) => t > s.simT - 60).length + '<b>/min</b>';
    if (stAvg) stAvg.innerHTML = (s.stats.served ? s.stats.waitSum / s.stats.served : 0).toFixed(1) + '<b>s</b>';
    if (stMax) stMax.innerHTML = s.stats.waitMax.toFixed(1) + '<b>s</b>';
    const logEl = document.getElementById('log');
    if (logEl && s.logs.length !== logEl.children.length) {
      logEl.innerHTML = '';
      s.logs.slice(0, 70).forEach((e) => {
        const d = document.createElement('div');
        d.className = 'lg';
        d.innerHTML = `<span class="t">${e.t}</span><span class="tag ${e.tag}">${TAGN[e.tag]}</span><span>${e.msg}</span>`;
        logEl.prepend(d);
      });
    }
  }

  if (!S) {
    return (
      <div id="control" className={styles.control}>
        <div className={styles.loading}>Initializing…</div>
      </div>
    );
  }

  return (
    <div id="control" className={styles.control}>
      <div id="boot" ref={bootElRef} className={styles.boot}>
        <pre id="bootTxt" ref={bootTxtRef} />
      </div>
      <header className={styles.topbar}>
        <button
          className={styles.tbBtn}
          onClick={() => showLanding()}
          aria-label="Back to briefing (landing page)"
        >
          <i data-lucide="arrow-left" /> BRIEFING
        </button>
        <button className={styles.tbBtn} id="btnMap" onClick={() => showMap()} aria-label="Open network map">
          <i data-lucide="map" /> MAP
        </button>
        <span className={styles.tbTitle} id="juncTitle">
          CONTROL DESK
        </span>
        <span className={styles.modeChip}>
          MODE <b id="modeChip">ACTUATED</b>
        </span>
        <div className={styles.tbRight}>
          <div className={styles.spd} id="spd" role="radiogroup" aria-label="Simulation speed">
            <button data-s="0.5" aria-label="Half speed">½×</button>
            <button data-s="1" aria-label="Normal speed" data-active="true">1×</button>
            <button data-s="2" aria-label="Double speed">2×</button>
            <button data-s="4" aria-label="Quadruple speed">4×</button>
          </div>
          <button className={styles.tbBtn} id="btnPause" aria-label="Pause or resume simulation">
            <i data-lucide="pause" id="icPause" />
            <i data-lucide="play" id="icPlay" className="hide" />
          </button>
          <button className={styles.tbBtn} id="btnReset" aria-label="Reset simulation">
            <i data-lucide="rotate-ccw" /> RESET
          </button>
          <ThemeToggle />
          <span className={styles.clock} id="clock" role="timer" aria-label="Simulation clock">
            07:00:00
          </span>
        </div>
      </header>
      <main className={styles.deck}>
        <ControlPanel />
        <Stage cvRef={cvRef} />
        <TelemetryPanel sparkRef={sparkRef} />
      </main>
    </div>
  );
}
