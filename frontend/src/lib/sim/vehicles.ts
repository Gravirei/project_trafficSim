/**
 * Vehicle spawning, kinematics, and pedestrian updates.
 * Verbatim port of traffic.html lines 959-1142.
 * Pure functions over SimState — no React, no DOM.
 */

import { clamp } from './helpers';
import { PALETTE, TRUCKC } from './constants';
import { posAt, project } from './geometry';
import type { Move, SimState, Vehicle, VehicleType } from './types';

export function makeVeh(
  S: SimState,
  a: number,
  b: number,
  mv: Move,
  type: VehicleType,
): Vehicle {
  const path = S.paths[a][b];
  const spec =
    type === 'truck'
      ? { len: 40, w: 9.5, des: 44, color: TRUCKC[(Math.random() * TRUCKC.length) | 0] }
      : type === 'EV'
      ? { len: 26, w: 11, des: 88, color: '#f2efe8' }
      : { len: 22, w: 10, des: 55, color: PALETTE[(Math.random() * PALETTE.length) | 0] };
  return {
    id: S.vid++,
    path,
    mv,
    type,
    color: spec.color,
    len: spec.len,
    w: spec.w,
    desired: spec.des,
    v: Math.min(spec.des * 0.7, 32),
    s: 0,
    wait: 0,
    brk: false,
    target: 0,
    circAng: null,
    laneId: path.laneId,
    x: path.pts[0][0],
    y: path.pts[0][1],
    ang: 0,
  };
}

/** Pick a movement (L/T/R) for leg `a` weighted by J.moveW. */
export function pickMove(S: SimState, a: number): Move {
  const avail = Object.keys(S.mvMap[a]) as Move[];
  let sum = 0;
  const ws = avail.map((m) => {
    const w = S.J.moveW[m] ?? 0.25;
    sum += w;
    return w;
  });
  let r = Math.random() * sum;
  for (let i = 0; i < avail.length; i++) {
    r -= ws[i];
    if (r <= 0) return avail[i];
  }
  return avail[avail.length - 1];
}

export function trySpawn(S: SimState, a: number): void {
  const mv = pickMove(S, a);
  const p = S.mvMap[a][mv];
  for (const u of S.vehs) {
    if (u.laneId === p.laneId && u.s < 70) return;
  }
  const isTruck = Math.random() < S.G.truck / 100;
  S.vehs.push(makeVeh(S, a, p.legB, mv, isTruck ? 'truck' : 'car'));
}

export function greenFor(S: SimState, leg: number, mv: Move): boolean {
  if (S.ctl.interval !== 'G') return false;
  return S.J.phases[S.ctl.phase].moves.some(
    (m) => m[0] === leg && (m[1] === '*' || m[1] === mv),
  );
}

export function circBlocked(S: SimState, v: Vehicle): boolean {
  const beta = (v.path.bmA as number) ?? 0;
  for (const u of S.vehs) {
    if (u === v || u.circAng == null) continue;
    const up = (((u.circAng - beta) % 360) + 360) % 360;
    if (up > 0 && up < 85) return true;
  }
  return false;
}

export function obstacleDist(S: SimState, v: Vehicle): number {
  let best = Infinity;
  for (const u of S.vehs) {
    if (u === v) continue;
    if (u.path === v.path) {
      if (u.s > v.s) {
        const g = u.s - v.s - (u.len + v.len) / 2 - 5;
        if (g < best) best = g;
      }
      continue;
    }
    const dx = u.x - v.x;
    const dy = u.y - v.y;
    if (dx * dx + dy * dy > 16900) continue;
    const pr = project(v.path, u.x, u.y);
    if (!pr || pr.s <= v.s + 1 || pr.lat >= 15) continue;
    if (v.id < u.id) {
      const mp = project(u.path, v.x, v.y);
      if (mp && mp.s > u.s + 1 && mp.lat < 15) continue;
    }
    const g = pr.s - v.s - (u.len + v.len) / 2 - 5;
    if (g < best) best = g;
  }
  return best;
}

export function updateVehicles(S: SimState, dt: number): void {
  // First pass: compute target speeds
  for (const v of S.vehs) {
    let stopD = Infinity;
    const g = greenFor(S, v.path.legA, v.path.mv);
    if (v.s < v.path.stopS - 2 && !g) stopD = v.path.stopS - 4 - v.s;
    else if (
      v.path.yieldS != null &&
      g &&
      v.s < v.path.yieldS - 2 &&
      circBlocked(S, v)
    ) {
      stopD = v.path.yieldS - 4 - v.s;
    }
    const d = Math.min(stopD, obstacleDist(S, v));
    let target = v.desired;
    if (v.s > v.path.slowS && v.s < v.path.slowE) target = Math.min(target, v.path.slowV);
    if (d < 1e4)
      target =
        d <= 0.6 ? 0 : Math.min(target, Math.sqrt(2 * 130 * Math.max(0, d - 1)) * 0.95);
    v.target = target;
  }
  // Second pass: integrate
  for (const v of S.vehs) {
    const a = v.type === 'truck' ? 36 : v.type === 'EV' ? 75 : 55;
    const dv = v.target - v.v;
    v.brk = dv < -6;
    v.v += clamp(dv, -230 * dt, a * dt);
    if (v.v < 0.4 && v.target < 0.5) v.v = 0;
    v.s += v.v * dt;
    if (v.v < 3 && v.s < v.path.stopS) v.wait += dt;
    const p = posAt(v.path, v.s);
    v.x = p.x;
    v.y = p.y;
    v.ang = p.ang;
    if (S.J.type === 'round') {
      const q = v.path;
      if (v.s >= (q.mergeS as number) && v.s < (q.arcS as number)) v.circAng = q.bmA as number;
      else if (v.s >= (q.arcS as number) && v.s <= (q.arcE as number)) {
        v.circAng = (q.bmA as number) - (v.s - (q.arcS as number)) / (S.J.R as number) / (Math.PI / 180);
      } else if (v.s > (q.arcE as number) && v.s <= (q.exitE as number) + 6) {
        v.circAng = q.bxA as number;
      } else v.circAng = null;
    }
  }
  // Third pass: remove exited vehicles
  for (let i = S.vehs.length - 1; i >= 0; i--) {
    const v = S.vehs[i];
    if (v.s >= v.path.total - 4) {
      S.vehs.splice(i, 1);
      S.stats.served++;
      S.stats.waitSum += v.wait;
      S.stats.waitMax = Math.max(S.stats.waitMax, v.wait);
      S.exits.push(S.simT);
      if (S.sel === v) S.sel = null;
    }
  }
}

export function updatePeds(S: SimState, dt: number): void {
  for (let i = S.peds.length - 1; i >= 0; i--) {
    const p = S.peds[i];
    p.t += (dt * p.sp) / S.ctl.pedDur;
    if (p.t > 1.06) S.peds.splice(i, 1);
  }
}
