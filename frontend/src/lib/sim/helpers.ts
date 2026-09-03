/**
 * Pure helpers — verbatim port from traffic.html lines 549-557.
 * No React or DOM imports.
 */

export const RAD = Math.PI / 180;

export function clamp(v: number, a: number, b: number): number {
  return Math.max(a, Math.min(b, v));
}

export function pick<T>(arr: readonly T[]): T {
  return arr[(Math.random() * arr.length) | 0];
}

/** Mulberry32 PRNG — deterministic seeded RNG (HTML lines 551-552). */
export function mulberry(seed: number) {
  return function (): number {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Rounded-rect helper. Caller passes a canvas 2D context. */
export function rr(
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
}

export function fmtClock(t: number): string {
  t |= 0;
  const h = (t / 3600) | 0;
  const m = ((t % 3600) / 60) | 0;
  const s = t % 60;
  return (
    String(h).padStart(2, '0') +
    ':' +
    String(m).padStart(2, '0') +
    ':' +
    String(s).padStart(2, '0')
  );
}

export type Compass8 = 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW' | 'N' | 'NE';

export function compass8(a: number): Compass8 {
  const labels: Compass8[] = ['E', 'SE', 'S', 'SW', 'W', 'NW', 'N', 'NE'];
  return labels[(((Math.round(a / 45) % 8) + 8) % 8) as 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7];
}
