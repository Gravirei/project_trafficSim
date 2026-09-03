/**
 * Signal controller FSM.
 * Verbatim port of traffic.html lines 1048-1139.
 * Pure functions over SimState. Toasts and log entries are emitted via
 * SimState.onToast and SimState.logs.push so this stays DOM-free.
 */

import { fmtClock } from './helpers';
import { TAGN } from './constants';
import { makeVeh } from './vehicles';
import type { LogEntry, SimState } from './types';

export function planDur(S: SimState, pIdx: number = S.ctl.phase): number {
  return S.J.phases[pIdx].dur === 'thru' ? S.G.thru : S.G.left;
}

export function demandForPhase(S: SimState, pi: number): boolean {
  if (S.ctl.pedPending) return true;
  const mv = S.J.phases[pi].moves;
  return S.vehs.some(
    (v) =>
      mv.some((m) => m[0] === v.path.legA && (m[1] === '*' || m[1] === v.path.mv)) &&
      v.s < v.path.stopS &&
      v.s > v.path.stopS - 230,
  );
}

export function anyDemand(S: SimState): boolean {
  if (S.ctl.pedPending) return true;
  return S.vehs.some((v) => v.s < v.path.stopS && v.s > v.path.stopS - 230);
}

function pushLog(S: SimState, tag: 'phase' | 'ev' | 'ped' | 'mode' | 'sys', msg: string): void {
  const entry: LogEntry = { t: fmtClock(7 * 3600 + S.simT), tag, msg };
  S.logs.push(entry);
  if (S.logs.length > 70) S.logs.shift();
}

export function termGreen(S: SimState): void {
  S.ctl.interval = 'Y';
  S.ctl.t = 0;
}

export function nextPhase(S: SimState): void {
  const ctl = S.ctl;
  ctl.pedActive = false;
  let p: number;
  if (ctl.preempt) {
    p = S.J.phases.findIndex(
      (ph) => ph.moves.some((m) => m[0] === ctl.preempt!.k && (m[1] === 'L' || m[1] === 'T' || m[1] === '*')),
    );
    if (p < 0)
      p = S.J.phases.findIndex((ph) => ph.moves.some((m) => m[0] === ctl.preempt!.k));
    if (p < 0) p = 0;
  } else {
    p = (ctl.phase + 1) % S.J.phases.length;
    if (ctl.mode === 'actuated') {
      for (let i = 0; i < S.J.phases.length - 1; i++) {
        if (demandForPhase(S, p)) break;
        pushLog(S, 'phase', 'PHASE ' + (p + 1) + ' SKIPPED — NO DEMAND');
        p = (p + 1) % S.J.phases.length;
      }
    }
  }
  ctl.phase = p;
  ctl.interval = 'G';
  ctl.t = 0;
  ctl.resting = ctl.mode === 'actuated' && !ctl.preempt && !demandForPhase(S, p);
  if (ctl.resting) pushLog(S, 'phase', 'REST IN GREEN — NO DEMAND');
  pushLog(S, 'phase', 'PHASE ' + (p + 1) + ' — ' + S.J.phases[p].name + ' · GREEN');
}

export function startWalk(S: SimState): void {
  const ctl = S.ctl;
  ctl.interval = 'WALK';
  ctl.t = 0;
  ctl.pedActive = true;
  ctl.pedPending = false;
  S.peds = [];
  const m = 2 + ((Math.random() * 3) | 0);
  for (let i = 0; i < m; i++) {
    S.peds.push({
      leg: ctl.pedSide,
      dir: Math.random() < 0.5 ? 1 : -1,
      t: 0,
      off: [-6, -2, 2, 6][i % 4],
      sp: 0.9 + Math.random() * 0.25,
    });
  }
  pushLog(S, 'ped', 'WALK INTERVAL — CROSSING ' + S.J.legNames[ctl.pedSide] + ' LEG');
}

export function preemptFor(S: SimState, k: number): void {
  if (S.ctl.preempt) {
    S.onToast?.('PREEMPTION ALREADY ACTIVE');
    return;
  }
  const p = S.mvMap[k]['T'] || S.mvMap[k]['L'] || (Object.values(S.mvMap[k])[0] as ReturnType<typeof makeVeh> extends infer _ ? never : never);
  if (!p) return;
  for (const u of S.vehs) {
    if (u.laneId === p.laneId && u.s < 95) {
      S.onToast?.('APPROACH OCCUPIED — TRY AGAIN');
      return;
    }
  }
  const v = makeVeh(S, k, p.legB, p.mv, 'EV');
  S.vehs.push(v);
  S.ctl.preempt = { k, evId: v.id };
  pushLog(S, 'ev', 'PREEMPTION — EMERGENCY VEHICLE ON ' + S.J.legFull[k]);
  S.onToast?.('PREEMPT · ' + S.J.legNames[k] + ' APPROACH');
  const serves = S.J.phases[S.ctl.phase].moves.some(
    (m) => m[0] === k && (m[1] === p.mv || m[1] === '*'),
  );
  if (S.ctl.interval === 'G' && !serves) termGreen(S);
  else if (S.ctl.interval === 'WALK') nextPhase(S);
}

export function evCleared(S: SimState): boolean {
  if (!S.ctl.preempt) return false;
  const ev = S.vehs.find((v) => v.id === S.ctl.preempt!.evId);
  return !ev || ev.s > ev.path.clearS + 20;
}

export function stepController(S: SimState, dt: number): void {
  const ctl = S.ctl;
  ctl.t += dt;
  const plan = planDur(S);
  if (ctl.interval === 'G') {
    if (ctl.preempt) {
      if (evCleared(S)) {
        pushLog(S, 'ev', 'EV CLEARED THE BOX — RELEASING PREEMPT');
        ctl.preempt = null;
        termGreen(S);
      }
    } else if (ctl.mode === 'manual') {
      // holds
    } else if (ctl.mode === 'fixed') {
      if (ctl.t >= plan) termGreen(S);
    } else {
      // actuated
      const minG = Math.min(5, plan);
      if (ctl.t >= minG) {
        if (ctl.resting) {
          if (demandForPhase(S, ctl.phase)) ctl.resting = false;
          else if (anyDemand(S)) {
            pushLog(S, 'phase', 'REST ENDED — NEW DEMAND');
            termGreen(S);
          }
        } else {
          if (!demandForPhase(S, ctl.phase)) {
            pushLog(S, 'phase', 'GAP-OUT — NO FURTHER DEMAND');
            termGreen(S);
          } else if (ctl.t >= plan) {
            pushLog(S, 'phase', 'MAX-OUT — GREEN LIMIT REACHED');
            termGreen(S);
          }
        }
      }
    }
  } else if (ctl.interval === 'Y') {
    if (ctl.t >= S.G.yellow) {
      ctl.interval = 'R';
      ctl.t = 0;
    }
  } else if (ctl.interval === 'R') {
    const busy = S.vehs.some(
      (v) => v.s > v.path.stopS + 4 && v.s < v.path.clearS,
    );
    if (ctl.t >= S.G.allred && (!busy || ctl.t >= S.G.allred + 3)) {
      if (ctl.pedPending && !ctl.preempt) startWalk(S);
      else nextPhase(S);
    }
  } else if (ctl.interval === 'WALK') {
    if (ctl.t >= ctl.pedDur) nextPhase(S);
  }
}
