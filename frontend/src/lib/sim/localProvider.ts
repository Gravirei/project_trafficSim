/**
 * LocalProvider — wraps the client-side sim factory and exposes
 * the SimulationProvider surface. Pure (no DOM); the view layer
 * supplies a refs bag and is responsible for canvas painting.
 */

import { JUNCTION_IDS, JUNCS, TAGN } from './constants';
import { createSimState } from './factory';
import { fmtClock } from './helpers';
import {
  preemptFor as ctrlPreempt,
} from './controller';
import { step } from './step';
import type { ControllerRefs, SimulationProvider } from './provider';
import type { LogEntry, Mode, SimState, Vehicle } from './types';

const sims = new Map<string, SimState>();

function ensureSim(id: string): SimState {
  let s = sims.get(id);
  if (!s) {
    if (!JUNCS[id]) throw new Error(`Unknown junction id: ${id}`);
    s = createSimState(JUNCS[id]);
    sims.set(id, s);
  }
  return s;
}

function pushLog(S: SimState, tag: 'phase' | 'ev' | 'ped' | 'mode' | 'sys', msg: string): void {
  const entry: LogEntry = { t: fmtClock(7 * 3600 + S.simT), tag, msg };
  S.logs.push(entry);
  if (S.logs.length > 70) S.logs.shift();
}

export function createLocalProvider(): SimulationProvider {
  return {
    getState: (id) => sims.get(id) ?? null,

    mount: (_id, _refs) => {
      // Per-junction DOM wiring is handled in useDeskController.
      // The local provider is intentionally DOM-free.
    },

    step: (id, dt) => {
      const s = ensureSim(id);
      step(s, dt);
    },

    frame: (id, dtReal, now) => {
      const s = ensureSim(id);
      if (s.booted && !s.paused) {
        const dt = dtReal * s.G.speed;
        const m = Math.max(1, Math.ceil(dt / 0.035));
        const h = dt / m;
        for (let i = 0; i < m; i++) step(s, h);
      }
      if (now - s.lastHud > 110) {
        s.lastHud = now;
        // HUD update is performed by the view layer which owns the DOM refs.
      }
    },

    key: (id, e) => {
      const s = ensureSim(id);
      if (!s.booted) return;
      if (e.code === 'Space' && (e.target as HTMLElement | null)?.tagName !== 'INPUT') {
        e.preventDefault();
        s.paused = !s.paused;
      }
      if (e.key >= '1' && e.key <= '9') {
        const i = +e.key - 1;
        if (i < s.J.phases.length) {
          if (s.ctl.preempt) {
            s.onToast?.('PREEMPTION ACTIVE');
            return;
          }
          s.ctl.phase = i;
          s.ctl.interval = 'G';
          s.ctl.t = 0;
          s.ctl.resting = false;
          pushLog(s, 'sys', 'OPERATOR OVERRIDE — FORCE PHASE ' + (i + 1));
        }
      }
    },

    select: (id, v: Vehicle | null) => {
      const s = ensureSim(id);
      s.sel = v;
    },

    pause: (id) => {
      const s = ensureSim(id);
      s.paused = !s.paused;
    },

    reset: (id) => {
      const s = ensureSim(id);
      s.vehs = [];
      s.peds = [];
      s.exits = [];
      s.simT = 0;
      s.vid = 1;
      s.sel = null;
      s.stats = { served: 0, waitSum: 0, waitMax: 0 };
      s.logs = [];
      Object.assign(s.ctl, {
        phase: 0,
        interval: 'G',
        t: 0,
        resting: false,
        pedPending: false,
        pedActive: false,
        preempt: null,
      });
      pushLog(s, 'sys', 'SIMULATION RESET — CLOCK 07:00:00');
      s.onToast?.('SIMULATION RESET');
    },

    setMode: (id, mode: Mode) => {
      const s = ensureSim(id);
      s.ctl.mode = mode;
      pushLog(s, 'mode', 'CONTROL MODE → ' + mode.toUpperCase());
    },

    setSpeed: (id, speed) => {
      const s = ensureSim(id);
      s.G.speed = speed;
    },

    setTiming: (id, key, value) => {
      const s = ensureSim(id);
      s.G[key] = value;
    },

    setDemand: (id, leg, value) => {
      const s = ensureSim(id);
      s.G.demand[leg] = value;
    },

    preempt: (id, leg) => {
      const s = ensureSim(id);
      ctrlPreempt(s, leg);
    },

    pedCall: (id) => {
      const s = ensureSim(id);
      if (s.ctl.pedPending || s.ctl.interval === 'WALK') {
        s.onToast?.('PED CALL ALREADY PENDING');
        return;
      }
      s.ctl.pedPending = true;
      s.ctl.pedSide = (Math.random() * s.J.legs.length) | 0;
      pushLog(s, 'ped', 'PEDESTRIAN CALL — ' + s.J.legNames[s.ctl.pedSide] + ' LEG');
      s.onToast?.('PED CALL REGISTERED');
    },

    toggleNight: (id) => {
      const s = ensureSim(id);
      s.night = !s.night;
    },
  };
}

/** Reset a specific sim (used by tests). */
export function _resetLocalProvider(): void {
  for (const id of JUNCTION_IDS) sims.delete(id);
}
