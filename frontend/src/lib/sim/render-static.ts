/**
 * Static layer renderer.
 * Verbatim port of traffic.html lines 819-956.
 * Returns an HTMLCanvasElement (offscreen) with the road/grass/buildings
 * painted once. The dynamic layer draws on top of this.
 */

import { mulberry, rr } from './helpers';
import { SZ } from './constants';
import type { SimState } from './types';

const dprDefault = 1;

function laneArrow(c: CanvasRenderingContext2D, kind: 'L' | 'T' | 'R') {
  c.lineWidth = 3.5;
  c.lineCap = 'round';
  c.lineJoin = 'round';
  c.beginPath();
  c.moveTo(13, 0);
  c.lineTo(0, 0);
  if (kind === 'L') {
    c.lineTo(0, 9);
    c.moveTo(0, 9);
    c.lineTo(-5, 4);
    c.moveTo(0, 9);
    c.lineTo(5, 4);
  } else if (kind === 'R') {
    c.lineTo(0, -9);
    c.moveTo(0, -9);
    c.lineTo(-5, -4);
    c.moveTo(0, -9);
    c.lineTo(5, -4);
  } else {
    c.moveTo(13, 0);
    c.lineTo(-4, 0);
    c.moveTo(-4, 0);
    c.lineTo(-11, -5);
    c.moveTo(-4, 0);
    c.lineTo(-11, 5);
  }
  c.stroke();
}

export function buildStaticLayer(S: SimState, dpr: number = dprDefault): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = SZ * dpr;
  c.height = SZ * dpr;
  const ctx = c.getContext('2d')!;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const D = !S.night;
  const col = D
    ? {
        ground: '#b7b3a6',
        side: '#c9c4b7',
        road: '#4d4f55',
        mark: 'rgba(240,238,230,.9)',
        yel: '#c9992f',
        bld: ['#a9a497', '#9f9a8d', '#b1ab9e', '#99958b'],
        edge: 'rgba(50,48,42,.5)',
        apron: '#a8a396',
        grass: '#7f8c6a',
      }
    : {
        ground: '#17181c',
        side: '#20232a',
        road: '#121317',
        mark: 'rgba(225,223,213,.5)',
        yel: 'rgba(205,158,55,.6)',
        bld: ['#1b1d23', '#17191e', '#202329', '#191b20'],
        edge: 'rgba(0,0,0,.6)',
        apron: '#2a2c32',
        grass: '#1b2620',
      };

  ctx.fillStyle = col.ground;
  ctx.fillRect(0, 0, SZ, SZ);

  // Sidewalk: central disc + leg bands
  ctx.fillStyle = col.side;
  ctx.beginPath();
  ctx.arc(450, 450, S.J.type === 'round' ? (S.J.boxR as number) + 18 : (S.J.hw as number) + 12, 0, 7);
  ctx.fill();

  const n = S.J.legs.length;
  for (let i = 0; i < n; i++) {
    ctx.save();
    ctx.translate(450, 450);
    ctx.rotate(S.J.legs[i] * (Math.PI / 180));
    const x0 = S.J.type === 'round' ? (S.J.stopD as number) + 8 : -6;
    ctx.fillRect(x0, -((S.J.hw as number) + 14), 470 - x0, (S.J.hw as number + 14) * 2);
    ctx.restore();
  }

  // Road surface
  for (let i = 0; i < n; i++) {
    ctx.save();
    ctx.translate(450, 450);
    ctx.rotate(S.J.legs[i] * (Math.PI / 180));
    const x0 = S.J.type === 'round' ? (S.J.R as number) + 16 : -6;
    ctx.fillStyle = col.road;
    ctx.fillRect(x0, -(S.J.hw as number), 470 - x0, (S.J.hw as number) * 2);
    ctx.restore();
  }

  if (S.J.type === 'round') {
    ctx.fillStyle = col.road;
    ctx.beginPath();
    ctx.arc(450, 450, (S.J.R as number) + 14, 0, 7);
    ctx.fill();
  }

  // Markings
  for (let i = 0; i < n; i++) {
    ctx.save();
    ctx.translate(450, 450);
    ctx.rotate(S.J.legs[i] * (Math.PI / 180));
    const EDGE = 470;
    const x0 = S.J.type === 'round' ? (S.J.R as number) + 16 : -6;
    ctx.fillStyle = col.yel;
    const yx = x0 + 4;
    ctx.fillRect(yx, -3.4, EDGE - yx, 2.4);
    ctx.fillRect(yx, 1, EDGE - yx, 2.4);
    if (!S.J.singleLane) {
      ctx.strokeStyle = col.mark;
      ctx.lineWidth = 3;
      ctx.setLineDash([13, 15]);
      const mid = ((S.J.off0 as number) + (S.J.off1 as number)) / 2;
      ctx.beginPath();
      ctx.moveTo((S.J.stopD as number) + 10, -mid);
      ctx.lineTo(EDGE, -mid);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo((S.J.stopD as number) + 10, mid);
      ctx.lineTo(EDGE, mid);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.strokeStyle = col.edge;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x0 + 3, -(S.J.hw as number));
    ctx.lineTo(EDGE, -(S.J.hw as number));
    ctx.moveTo(x0 + 3, S.J.hw as number);
    ctx.lineTo(EDGE, S.J.hw as number);
    ctx.stroke();
    ctx.fillStyle = col.mark;
    ctx.fillRect((S.J.stopD as number) - 3, -(S.J.hw as number) + 1, 5, (S.J.hw as number) - 3);
    for (let y = -(S.J.hw as number) + 3; y < (S.J.hw as number) - 8; y += 15) {
      ctx.fillRect((S.J.boxR as number) + 3, y, 20, 8);
    }
    ctx.strokeStyle = col.mark;
    const hasT = Object.values(S.paths[i]).some((p) => p.mv === 'T');
    if (S.J.singleLane) {
      ctx.save();
      ctx.translate((S.J.stopD as number) + 105, -(S.J.offA as number));
      laneArrow(ctx, 'T');
      ctx.restore();
    } else {
      ctx.save();
      ctx.translate((S.J.stopD as number) + 105, -(S.J.off0 as number));
      laneArrow(ctx, 'L');
      ctx.restore();
      ctx.save();
      ctx.translate((S.J.stopD as number) + 105, -(S.J.off1 as number));
      laneArrow(ctx, hasT ? 'T' : 'R');
      ctx.restore();
    }
    ctx.restore();
  }

  // Roundabout interior
  if (S.J.type === 'round') {
    ctx.strokeStyle = col.mark;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(450, 450, (S.J.R as number) + 11, 0, 7);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(450, 450, (S.J.R as number) - 11, 0, 7);
    ctx.stroke();
    ctx.fillStyle = col.apron;
    ctx.beginPath();
    ctx.arc(450, 450, (S.J.R as number) - 13, 0, 7);
    ctx.fill();
    ctx.fillStyle = col.grass;
    ctx.beginPath();
    ctx.arc(450, 450, (S.J.R as number) - 29, 0, 7);
    ctx.fill();
    ctx.strokeStyle = D ? 'rgba(60,58,50,.5)' : 'rgba(0,0,0,.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(450, 450, (S.J.R as number) - 29.5, 0, 7);
    ctx.stroke();
    ctx.strokeStyle = col.mark;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    for (const th of [45, 135, 225, 315]) {
      const px = 450 + (S.J.R as number) * Math.cos(th * (Math.PI / 180));
      const py = 450 + (S.J.R as number) * Math.sin(th * (Math.PI / 180));
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(Math.atan2(-Math.cos(th * (Math.PI / 180)), Math.sin(th * (Math.PI / 180))));
      ctx.beginPath();
      ctx.moveTo(-4, -5);
      ctx.lineTo(3, 0);
      ctx.lineTo(-4, 5);
      ctx.stroke();
      ctx.restore();
    }
  }

  // Asphalt speckle (clipped)
  ctx.save();
  ctx.beginPath();
  for (let i = 0; i < n; i++) {
    ctx.save();
    ctx.translate(450, 450);
    ctx.rotate(S.J.legs[i] * (Math.PI / 180));
    const x0 = S.J.type === 'round' ? (S.J.R as number) + 16 : -6;
    ctx.rect(x0, -(S.J.hw as number), 470 - x0, (S.J.hw as number) * 2);
    ctx.restore();
  }
  if (S.J.type === 'round') ctx.arc(450, 450, (S.J.R as number) + 13, 0, 7);
  ctx.clip();
  const rng = mulberry(20240707);
  for (let i = 0; i < 520; i++) {
    ctx.fillStyle = rng() < 0.5 ? 'rgba(255,255,255,.045)' : 'rgba(0,0,0,.09)';
    ctx.fillRect(rng() * SZ, rng() * SZ, 1.6, 1.6);
  }
  ctx.restore();

  // Buildings
  const brng = mulberry(3700 + (((S.J.mapPos.x * 7 + S.J.mapPos.y) | 0)));
  for (let t2 = 0; t2 < 170; t2++) {
    const bw = 55 + brng() * 110;
    const bh = 55 + brng() * 110;
    const bx = 14 + brng() * (SZ - 28 - bw);
    const by = 14 + brng() * (SZ - 28 - bh);
    let ok = true;
    for (const a of S.J.legs) {
      const ca = Math.cos(a * (Math.PI / 180));
      const sa = Math.sin(a * (Math.PI / 180));
      let mn = 1e9;
      let mx = -1e9;
      let rmn = 1e9;
      for (const [px, py] of [
        [bx, by],
        [bx + bw, by],
        [bx, by + bh],
        [bx + bw, by + bh],
      ] as Array<[number, number]>) {
        const lat = -sa * (px - 450) + ca * (py - 450);
        mn = Math.min(mn, lat);
        mx = Math.max(mx, lat);
        rmn = Math.min(rmn, Math.hypot(px - 450, py - 450));
      }
      if (mn < (S.J.hw as number) + 18 && mx > -((S.J.hw as number) + 18)) {
        ok = false;
        break;
      }
      if (S.J.type === 'round' && rmn < (S.J.boxR as number) + 24) {
        ok = false;
        break;
      }
    }
    if (!ok) continue;
    ctx.fillStyle = col.bld[(brng() * 4) | 0];
    ctx.fillRect(bx, by, bw, bh);
    ctx.strokeStyle = D ? 'rgba(60,58,50,.5)' : 'rgba(0,0,0,.5)';
    ctx.lineWidth = 1;
    ctx.strokeRect(bx + 0.5, by + 0.5, bw - 1, bh - 1);
    for (let wx = bx + 9; wx < bx + bw - 8; wx += 14) {
      for (let wy = by + 9; wy < by + bh - 8; wy += 14) {
        if (D) {
          ctx.fillStyle = 'rgba(60,62,58,.5)';
          ctx.fillRect(wx, wy, 3.5, 4.5);
        } else if (brng() < 0.28) {
          ctx.fillStyle = 'rgba(240,180,92,.75)';
          ctx.fillRect(wx, wy, 3.5, 4.5);
        }
      }
    }
  }

  // Streetlight pools at night
  if (S.night) {
    for (let i = 0; i < n; i++) {
      const a = S.J.legs[i] * (Math.PI / 180);
      const ux = Math.cos(a);
      const uy = Math.sin(a);
      const lx = 450 + ux * ((S.J.stopD as number) + 14) - uy * ((S.J.hw as number) + 8);
      const ly = 450 + uy * ((S.J.stopD as number) + 14) + ux * ((S.J.hw as number) + 8);
      const g2 = ctx.createRadialGradient(lx, ly, 6, lx, ly, 90);
      g2.addColorStop(0, 'rgba(255,198,120,.10)');
      g2.addColorStop(1, 'rgba(255,198,120,0)');
      ctx.fillStyle = g2;
      ctx.beginPath();
      ctx.arc(lx, ly, 90, 0, 7);
      ctx.fill();
      ctx.fillStyle = '#33363c';
      ctx.beginPath();
      ctx.arc(lx, ly, 3, 0, 7);
      ctx.fill();
    }
  }

  // Approach labels
  ctx.font = '600 10px "IBM Plex Mono",monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (let i = 0; i < n; i++) {
    const a = S.J.legs[i] * (Math.PI / 180);
    const ux = Math.cos(a);
    const uy = Math.sin(a);
    const L2 = (S.J.stopD as number) + 205;
    const side = -((S.J.hw as number) + 44);
    const wx = 450 + ux * L2 + uy * side;
    const wy = 450 + uy * L2 - ux * side;
    const txt = S.J.legLabel[i];
    const w = ctx.measureText(txt).width + 18;
    ctx.fillStyle = 'rgba(13,14,16,.78)';
    ctx.fillRect(wx - w / 2, wy - 11, w, 22);
    ctx.strokeStyle = D ? 'rgba(30,30,26,.6)' : '#26282e';
    ctx.lineWidth = 1;
    ctx.strokeRect(wx - w / 2 + 0.5, wy - 10.5, w - 1, 21);
    ctx.fillStyle = D ? '#6d6a60' : '#8b8a84';
    ctx.fillText(txt, wx, wy);
  }

  return c;
}

// Suppress unused helper reference
void rr;
