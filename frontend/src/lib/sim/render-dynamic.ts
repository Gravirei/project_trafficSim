/**
 * Dynamic layer renderer — detectors, signal heads, pedestrians, vehicles.
 * Verbatim port of traffic.html lines 1153-1255.
 * Paints on top of the static layer.
 */

import { SP } from './constants';
import type { SimState } from './types';

const dprDefault = 1;

export function drawDetectors(ctx: CanvasRenderingContext2D, S: SimState, dpr: number = dprDefault): void {
  void dpr;
  const n = S.J.legs.length;
  for (let k = 0; k < n; k++) {
    ctx.save();
    ctx.translate(450, 450);
    ctx.rotate(S.J.legs[k] * (Math.PI / 180));
    const lanes = S.J.singleLane ? [S.J.offA as number] : [S.J.off0 as number, S.J.off1 as number];
    lanes.forEach((off, li) => {
      const occ = S.vehs.some(
        (v) =>
          v.path.legA === k &&
          v.laneId === (S.J.singleLane ? k : k * 2 + li) &&
          SP - v.s > (S.J.stopD as number) + 21 &&
          SP - v.s < (S.J.stopD as number) + 47,
      );
      ctx.strokeStyle = `rgba(240,166,60,${occ ? 0.95 : 0.28})`;
      ctx.lineWidth = occ ? 2 : 1.2;
      ctx.setLineDash([4, 3]);
      ctx.strokeRect((S.J.stopD as number) + 21, -off - 5.5, 26, 11);
      ctx.setLineDash([]);
    });
    ctx.restore();
  }
}

export function drawHeads(ctx: CanvasRenderingContext2D, S: SimState, dpr: number = dprDefault): void {
  void dpr;
  const n = S.J.legs.length;
  for (let k = 0; k < n; k++) {
    ctx.save();
    ctx.translate(450, 450);
    ctx.rotate(S.J.legs[k] * (Math.PI / 180));
    ctx.translate((S.J.stopD as number) - 10, -((S.J.hw as number) + 16));
    const serves = S.J.phases[S.ctl.phase].moves.find((m) => m[0] === k);
    let r = false;
    let y = false;
    let g = false;
    let arrow = false;
    if (serves) {
      if (S.ctl.interval === 'G') {
        if (serves[1] === 'L' && S.J.type !== 'round') arrow = true;
        else g = true;
      } else if (S.ctl.interval === 'Y') y = true;
      else r = true;
    } else r = true;
    ctx.fillStyle = S.night ? '#111216' : '#1b1d22';
    ctx.strokeStyle = S.night ? '#2c2f36' : '#3a3d45';
    ctx.lineWidth = 1;
    // rounded rect inline (rr takes (c,x,y,w,h,r))
    ctx.beginPath();
    ctx.moveTo(-23 + 4, -8);
    ctx.arcTo(-23 + 46, -8, -23 + 46, -8 + 16, 4);
    ctx.arcTo(-23 + 46, -8 + 16, -23, -8 + 16, 4);
    ctx.arcTo(-23, -8 + 16, -23, -8, 4);
    ctx.arcTo(-23, -8, -23 + 46, -8, 4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    const lamps: Array<[string, boolean]> = [
      ['#e5484d', r],
      ['#f2b13c', y],
      ['#4fc47a', g],
    ];
    lamps.forEach((L, i) => {
      ctx.beginPath();
      ctx.arc(-15 + i * 10, 0, 4, 0, 7);
      ctx.fillStyle = L[1] ? L[0] : 'rgba(255,255,255,.07)';
      ctx.fill();
      if (L[1]) {
        ctx.shadowColor = L[0];
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    });
    if (arrow) {
      ctx.fillStyle = '#4fc47a';
      ctx.shadowColor = '#4fc47a';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.moveTo(16, 7);
      ctx.lineTo(11, -1);
      ctx.lineTo(21, -1);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;
    }
    ctx.restore();
  }
}

export function drawPeds(ctx: CanvasRenderingContext2D, S: SimState, dpr: number = dprDefault): void {
  void dpr;
  const half = (S.J.hw as number) + 16;
  const d = (S.J.boxR as number) + 13;
  const fig = (x: number, y: number, moving: boolean, seed: number) => {
    ctx.fillStyle = '#e6e3d8';
    ctx.strokeStyle = '#e6e3d8';
    ctx.lineWidth = 1.6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(x, y - 4.4, 1.9, 0, 7);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x, y - 2.6);
    ctx.lineTo(x, y + 1.4);
    ctx.stroke();
    const sw = moving ? Math.sin(seed + S.simT * 9) * 2.4 : 1.4;
    ctx.beginPath();
    ctx.moveTo(x, y + 1.4);
    ctx.lineTo(x - sw, y + 4.6);
    ctx.moveTo(x, y + 1.4);
    ctx.lineTo(x + sw, y + 4.6);
    ctx.stroke();
  };
  if (S.ctl.pedPending) {
    const k = S.ctl.pedSide;
    const a = S.J.legs[k] * (Math.PI / 180);
    const ux = Math.cos(a);
    const uy = Math.sin(a);
    for (const e of [-1, 1]) {
      fig(450 + ux * d - uy * half * e, 450 + uy * d + ux * half * e, false, e * 7);
    }
  }
  for (const p of S.peds) {
    const a = S.J.legs[p.leg] * (Math.PI / 180);
    const ux = Math.cos(a);
    const uy = Math.sin(a);
    const dd = d + p.off;
    const x0 = p.dir > 0 ? -half : half;
    const x = x0 + (p.dir > 0 ? 1 : -1) * 2 * half * p.t;
    fig(450 + ux * dd - uy * x, 450 + uy * dd + ux * x, true, p.off * 7);
  }
}

export function drawVehicles(ctx: CanvasRenderingContext2D, S: SimState, dpr: number = dprDefault): void {
  void dpr;
  for (const v of S.vehs) {
    ctx.save();
    ctx.translate(v.x, v.y);
    ctx.rotate(v.ang);
    const L = v.len;
    const W = v.w;
    if (S.night && v.v > 4) {
      ctx.fillStyle = 'rgba(255,236,190,.07)';
      ctx.beginPath();
      ctx.moveTo(L / 2, -W / 2 + 1);
      ctx.lineTo(L / 2 + 38, -W - 6);
      ctx.lineTo(L / 2 + 38, W + 6);
      ctx.lineTo(L / 2, W / 2 - 1);
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillStyle = v.color;
    // rounded rect for body
    const r = 2.5;
    ctx.beginPath();
    ctx.moveTo(-L / 2 + r, -W / 2);
    ctx.arcTo(L / 2, -W / 2, L / 2, W / 2, r);
    ctx.arcTo(L / 2, W / 2, -L / 2, W / 2, r);
    ctx.arcTo(-L / 2, W / 2, -L / 2, -W / 2, r);
    ctx.arcTo(-L / 2, -W / 2, L / 2, -W / 2, r);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,.35)';
    ctx.lineWidth = 1;
    ctx.stroke();
    if (v.type === 'truck') {
      ctx.fillStyle = 'rgba(0,0,0,.28)';
      ctx.fillRect(L / 2 - 9.5, -W / 2, 3, W);
    } else {
      ctx.fillStyle = 'rgba(15,17,20,.55)';
      ctx.fillRect(L / 2 - 7, -W / 2 + 1.5, 3, W - 3);
      if (v.type === 'EV') {
        ctx.fillStyle = '#e5484d';
        ctx.fillRect(-2, -W / 2, 4, W);
      }
    }
    if (v.brk) {
      ctx.fillStyle = '#ff5a5f';
      ctx.fillRect(-L / 2, -W / 2, 1.8, 2.6);
      ctx.fillRect(-L / 2, W / 2 - 2.6, 1.8, 2.6);
    }
    ctx.restore();
    if (v.type === 'EV') {
      const ph = Math.floor(S.simT * 9) % 2;
      ctx.beginPath();
      ctx.arc(v.x, v.y, 16, 0, 7);
      ctx.fillStyle = ph ? 'rgba(229,72,77,.22)' : 'rgba(255,244,224,.25)';
      ctx.fill();
      ctx.fillStyle = ph ? '#e5484d' : '#fff4e0';
      ctx.fillRect(v.x - 2, v.y - 2, 4, 4);
    }
    if (v === S.sel) {
      ctx.strokeStyle = '#f0a63c';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(v.x, v.y, 16, 0, 7);
      ctx.stroke();
    }
  }
}

/** Orchestrator: clear, blit static, draw dynamic layers. */
export function drawFrame(
  ctx: CanvasRenderingContext2D,
  staticCv: HTMLCanvasElement | null,
  S: SimState,
  dpr: number = dprDefault,
): void {
  if (!staticCv) return;
  // Logical square size is SZ; the ctx transform handles DPR.
  const SZ = 900;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, SZ, SZ);
  ctx.drawImage(staticCv, 0, 0, SZ, SZ);
  drawDetectors(ctx, S, dpr);
  drawHeads(ctx, S, dpr);
  drawPeds(ctx, S, dpr);
  drawVehicles(ctx, S, dpr);
}
