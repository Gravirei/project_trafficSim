/**
 * Throughput sparkline — bucketed veh/min over the last 90s.
 * Verbatim port of traffic.html lines 1271-1279.
 */

import type { SimState } from './types';

export function drawSparkline(
  ctx: CanvasRenderingContext2D,
  S: SimState,
  w: number = 272,
  h: number = 46,
): void {
  ctx.clearRect(0, 0, w, h);
  const buckets = new Array(30).fill(0);
  for (const t of S.exits) {
    const i = Math.floor((S.simT - t) / 3);
    if (i >= 0 && i < 30) buckets[29 - i]++;
  }
  const mx = Math.max(2, ...buckets);
  ctx.fillStyle = '#f0a63c';
  buckets.forEach((b, i) => {
    const bh = (b / mx) * (h - 6);
    ctx.fillRect(i * (w / 30) + 1, h - bh, w / 30 - 2, bh);
  });
  ctx.strokeStyle = '#26282e';
  ctx.lineWidth = 1;
  ctx.strokeRect(0.5, 0.5, w - 1, h - 1);
}
