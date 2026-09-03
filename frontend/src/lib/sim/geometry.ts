/**
 * Geometry — verbatim port of traffic.html lines 681-788.
 * Builds per-leg→leg paths for the 4 junction shapes and exposes
 * parametric position / projection helpers.
 *
 * Pure functions; no DOM mutation. Returns plain data structures
 * that the renderer module paints to canvas.
 */

import { clamp, RAD } from './helpers';
import { SP } from './constants';
import type { JunctionDef, Move, PathPoint } from './types';

interface LegUnit {
  ux: number;
  uy: number;
}

interface LegIn {
  x: number;
  y: number;
}

/** Build a through/turn path between two legs. HTML lines 683-710. */
export function buildTurn(
  J: JunctionDef,
  a: number,
  b: number,
  mv: Move,
  L: LegUnit[],
  lIn: LegIn[],
  lOut: LegIn[],
): PathPoint {
  const A = L[a];
  const B = L[b];
  const li = lIn[a];
  const lo = lOut[b];
  const pts: [number, number][] = [];
  const cum: number[] = [];
  let acc = 0;
  let prev: [number, number] | null = null;
  let cs = 0;
  let ce = 0;
  const push = (p: [number, number]) => {
    if (prev) acc += Math.hypot(p[0] - prev[0], p[1] - prev[1]);
    cum.push(acc);
    pts.push(p);
    prev = p;
  };
  const off = mv === 'L' ? (J.off0 as number) : (J.off1 as number);
  const Ein = (s: number): [number, number] => [
    450 + A.ux * s + li.x * off,
    450 + A.uy * s + li.y * off,
  ];
  const Eout = (s: number): [number, number] => [
    450 + B.ux * s + lo.x * off,
    450 + B.uy * s + lo.y * off,
  ];
  if (mv === 'T') {
    for (let s = SP; s >= -SP + 24; s -= 16) push(Ein(s));
    push(Ein(-SP + 24));
    cs = acc * 0.5;
    ce = cs;
  } else {
    const RX = (lo.x - li.x) * off;
    const RY = (lo.y - li.y) * off;
    const det = A.ux * -B.uy - -B.ux * A.uy;
    const s1 = (RX * -B.uy - -B.ux * RY) / det;
    const s2 = (A.ux * RY - RX * A.uy) / det;
    const phi = Math.acos(clamp(-(A.ux * B.ux + A.uy * B.uy), -1, 1)) / RAD;
    let r = (mv === 'L' ? (J.rL as number) : (J.rR as number)) * clamp(phi / 90, 0.45, 1.4);
    r = Math.max(10, Math.min(r, SP - 30 - Math.max(s1, s2)));
    for (let s = SP; s > s1 + r; s -= 14) push(Ein(s));
    push(Ein(s1 + r));
    cs = acc;
    const P0 = Ein(s1 + r);
    const Q = Ein(s1);
    const P2 = Eout(s2 + r);
    for (let i = 1; i <= 14; i++) {
      const t = i / 14;
      const u = 1 - t;
      push([
        u * u * P0[0] + 2 * u * t * Q[0] + t * t * P2[0],
        u * u * P0[1] + 2 * u * t * Q[1] + t * t * P2[1],
      ]);
    }
    ce = acc;
    for (let s = s2 + r + 16; s < SP - 10; s += 16) push(Eout(s));
    push(Eout(SP));
  }
  return { pts, cum, total: acc, cs, ce, slowS: Infinity, slowE: Infinity, slowV: 99, mv, legA: a, legB: b, lane: 0, laneId: 0, stopS: 0, clearS: 0 };
}

/** Build a roundabout path. HTML lines 711-743. */
export function buildRound(
  J: JunctionDef,
  a: number,
  b: number,
  mv: Move,
  L: LegUnit[],
  lIn: LegIn[],
  lOut: LegIn[],
): PathPoint {
  const A = L[a];
  const B = L[b];
  const li = lIn[a];
  const lo = lOut[b];
  const R = J.R as number;
  const off = J.offA as number;
  const pts: [number, number][] = [];
  const cum: number[] = [];
  let acc = 0;
  let prev: [number, number] | null = null;
  const push = (p: [number, number]) => {
    if (prev) acc += Math.hypot(p[0] - prev[0], p[1] - prev[1]);
    cum.push(acc);
    pts.push(p);
    prev = p;
  };
  const Ein = (s: number): [number, number] => [450 + A.ux * s + li.x * off, 450 + A.uy * s + li.y * off];
  const Eout = (s: number): [number, number] => [450 + B.ux * s + lo.x * off, 450 + B.uy * s + lo.y * off];
  const bm = (J.legs[a] - 40) as number;
  const bx = (J.legs[b] + 40) as number;
  for (let s = SP; s > (J.De as number); s -= 14) push(Ein(s));
  push(Ein(J.De as number));
  const mergeS = acc;
  const M: [number, number] = [450 + R * Math.cos(bm * RAD), 450 + R * Math.sin(bm * RAD)];
  const tv = { x: Math.sin(bm * RAD), y: -Math.cos(bm * RAD) };
  const P0 = Ein(J.De as number);
  const P1: [number, number] = [P0[0] - A.ux * (J.kM as number), P0[1] - A.uy * (J.kM as number)];
  const P2: [number, number] = [M[0] - tv.x * (J.kM as number), M[1] - tv.y * (J.kM as number)];
  for (let i = 1; i <= 10; i++) {
    const t = i / 10;
    const u = 1 - t;
    push([
      u * u * u * P0[0] + 3 * u * u * t * P1[0] + 3 * u * t * t * P2[0] + t * t * t * M[0],
      u * u * u * P0[1] + 3 * u * u * t * P1[1] + 3 * u * t * t * P2[1] + t * t * t * M[1],
    ]);
  }
  const arcS = acc;
  const d = (((bm - bx) % 360) + 360) % 360;
  if (d > 6) {
    const nA = Math.ceil(d / 6);
    for (let i = 1; i <= nA; i++) {
      const t = bm - (d * i) / nA;
      push([450 + R * Math.cos(t * RAD), 450 + R * Math.sin(t * RAD)]);
    }
  }
  const arcE = acc;
  const X: [number, number] = [450 + R * Math.cos(bx * RAD), 450 + R * Math.sin(bx * RAD)];
  const tx = { x: Math.sin(bx * RAD), y: -Math.cos(bx * RAD) };
  const Q3 = Eout(J.Dx as number);
  const Q2: [number, number] = [Q3[0] - B.ux * (J.kE as number), Q3[1] - B.uy * (J.kE as number)];
  const Q1: [number, number] = [X[0] + tx.x * (J.kE as number), X[1] + tx.y * (J.kE as number)];
  for (let i = 1; i <= 10; i++) {
    const t = i / 10;
    const u = 1 - t;
    push([
      u * u * u * X[0] + 3 * u * u * t * Q1[0] + 3 * u * t * t * Q2[0] + t * t * t * Q3[0],
      u * u * u * X[1] + 3 * u * u * t * Q1[1] + 3 * u * t * t * Q2[1] + t * t * t * Q3[1],
    ]);
  }
  const exitE = acc;
  for (let s = (J.Dx as number) + 16; s < SP - 10; s += 16) push(Eout(s));
  push(Eout(SP));
  return {
    pts,
    cum,
    total: acc,
    cs: mergeS,
    ce: exitE,
    mergeS,
    arcS,
    arcE,
    exitE,
    bmA: bm,
    bxA: bx,
    yieldS: mergeS - 8,
    slowS: mergeS - 30,
    slowE: exitE,
    slowV: 30,
    mv,
    legA: a,
    legB: b,
    lane: 0,
    laneId: a,
    stopS: SP - (J.stopD as number),
    clearS: 0,
  };
}

/** Build full path table + movement map for a junction. HTML lines 744-775. */
export function buildPaths(J: JunctionDef): {
  paths: Record<number, Record<number, PathPoint>>;
  mvMap: Record<number, Record<string, PathPoint>>;
} {
  const n = J.legs.length;
  const L: LegUnit[] = J.legs.map((a) => ({ ux: Math.cos(a * RAD), uy: Math.sin(a * RAD) }));
  const lIn: LegIn[] = L.map((u) => ({ x: u.uy, y: -u.ux }));
  const lOut: LegIn[] = L.map((u) => ({ x: -u.uy, y: u.ux }));
  const paths: Record<number, Record<number, PathPoint>> = L.map(() => ({})) as Record<
    number,
    Record<number, PathPoint>
  >;
  const mvMap: Record<number, Record<string, PathPoint>> = L.map(() => ({})) as Record<
    number,
    Record<string, PathPoint>
  >;
  for (let a = 0; a < n; a++) {
    for (let b = 0; b < n; b++) {
      if (a === b) continue;
      const A = L[a];
      const B = L[b];
      let mv: Move;
      if (J.type === 'round') {
        const d = ((((J.legs[a] - 40) - (J.legs[b] + 40)) % 360) + 360) % 360;
        mv = d < 60 ? 'R' : d < 150 ? 'T' : 'L';
      } else {
        const cr = A.ux * B.uy - A.uy * B.ux;
        const dot = A.ux * B.ux + A.uy * B.uy;
        mv = Math.abs(cr) < 0.09 && dot < -0.9 ? 'T' : cr > 0 ? 'L' : 'R';
      }
      const p: PathPoint =
        J.type === 'round' ? buildRound(J, a, b, mv, L, lIn, lOut) : buildTurn(J, a, b, mv, L, lIn, lOut);
      p.mv = mv;
      p.legA = a;
      p.legB = b;
      p.lane = J.singleLane ? 0 : mv === 'L' ? 0 : 1;
      p.laneId = J.singleLane ? a : a * 2 + p.lane;
      p.stopS = SP - (J.stopD as number);
      if (J.type === 'round') {
        p.slowS = (p.mergeS as number) - 30;
        p.slowE = p.exitE as number;
        p.slowV = 30;
      } else if (mv === 'T') {
        p.slowS = Infinity;
        p.slowE = Infinity;
        p.slowV = 99;
      } else {
        p.slowS = p.cs - 40;
        p.slowE = p.ce + 8;
        p.slowV = mv === 'L' ? 34 : 30;
      }
      p.clearS = p.total - 30;
      for (let i = 0; i < p.pts.length; i++) {
        const dx = p.pts[i][0] - 450;
        const dy = p.pts[i][1] - 450;
        if (p.cum[i] > p.stopS + 14 && Math.hypot(dx, dy) > (J.clearR as number)) {
          p.clearS = p.cum[i];
          break;
        }
      }
      paths[a][b] = p;
      mvMap[a][mv] = p;
    }
  }
  return { paths, mvMap };
}

/** Binary-search sample a position + heading along a path. HTML lines 776-781. */
export function posAt(
  path: PathPoint,
  s: number,
): { x: number; y: number; ang: number } {
  s = clamp(s, 0, path.total - 0.001);
  let lo = 0;
  let hi = path.cum.length - 1;
  while (lo < hi) {
    const md = (lo + hi) >> 1;
    if (path.cum[md] < s) lo = md + 1;
    else hi = md;
  }
  const i = Math.max(1, lo);
  const t = (s - path.cum[i - 1]) / ((path.cum[i] - path.cum[i - 1]) || 1);
  const a = path.pts[i - 1];
  const b = path.pts[i];
  return {
    x: a[0] + (b[0] - a[0]) * t,
    y: a[1] + (b[1] - a[1]) * t,
    ang: Math.atan2(b[1] - a[1], b[0] - a[0]),
  };
}

/** Project a world (x,y) onto a path; returns null if too far. */
export function project(
  path: PathPoint,
  x: number,
  y: number,
): { s: number; lat: number } | null {
  let bi = -1;
  let bd = 1e9;
  for (let i = 0; i < path.pts.length; i++) {
    const dx = path.pts[i][0] - x;
    const dy = path.pts[i][1] - y;
    const d = dx * dx + dy * dy;
    if (d < bd) {
      bd = d;
      bi = i;
    }
  }
  if (bd > 400) return null;
  return { s: path.cum[bi], lat: Math.sqrt(bd) };
}
