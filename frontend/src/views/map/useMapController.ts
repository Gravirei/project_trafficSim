'use client';

import { RefObject, useEffect, useRef } from 'react';
import { JUNCS, JUNCTION_IDS, fmtClock } from '@/lib/sim';
import type { Interval } from '@/lib/sim/types';

/** Per-junction state the map sidebar/canvas reflect. */
export interface MapJunctionState {
  phase: number;
  interval: Interval;
  t: number;
}

export interface UseMapControllerOptions {
  cvRef: RefObject<HTMLCanvasElement | null>;
  /** Called when the user clicks a junction marker. */
  onJunctionClick: (id: string) => void;
  /** Receives the latest junction state map for sidebar colour-sync. */
  onStateChange: (states: Record<string, MapJunctionState>) => void;
}

export interface MapController {
  /** Bump zoom in around a focal point. */
  zoomIn: () => void;
  zoomOut: () => void;
  fit: () => void;
  /** Tear down (called automatically on unmount). */
  destroy: () => void;
}

const ROADS: Array<[number, number][]> = [
  [[80, 360], [560, 360]],
  [[560, 360], [1300, 360]],
  [[1300, 360], [1780, 360]],
  [[560, 60], [560, 360]],
  [[560, 360], [560, 700], [640, 950], [900, 800]],
  [[900, 800], [1300, 510], [1300, 360]],
  [[900, 800], [900, 1160]],
  [[900, 1160], [640, 1160], [640, 950]],
  [[900, 1160], [900, 1440]],
  [[1300, 360], [1300, 90]],
  // Penta (J45) at (240, 1000) — 5 short stub roads fanning out at the
  // junction's 5 leg angles (legs are [90, 162, 234, 306, 18]°, screen-y
  // down). 220 px each.
  [[240, 1000], [240, 1220]],     // S  (90°, straight down)
  [[240, 1000], [31, 1068]],      // SW (162°)
  [[240, 1000], [111, 822]],      // NW (234°)
  [[240, 1000], [240, 780]],      // N  (306°, straight up)
  [[240, 1000], [449, 1068]],     // NE (18°)
];
const THIN: Array<[number, number][]> = [
  [[80, 700], [560, 700]],
  [[1300, 510], [1300, 700], [1780, 700]],
  [[700, 1440], [700, 1160]],
  [[1300, 90], [1780, 90]],
];
const PARKS: Array<[number, number, number, number]> = [
  [1000, 880, 190, 170],
  [120, 460, 240, 240],
];

const ivColor = (iv: string) => (iv === 'G' ? '#4fc47a' : iv === 'Y' ? '#f2b13c' : '#e5484d');

/**
 * Owns the network map's canvas + rAF loop + pointer/wheel interaction.
 * Returns a stable API (zoomIn/zoomOut/fit) for the toolbar.
 */
export function useMapController(opts: UseMapControllerOptions): MapController {
  const camRef = useRef({ x: 900, y: 750 });
  const zoomRef = useRef(0.85);
  const hoverRef = useRef<string | null>(null);
  const dragRef = useRef<{ x: number; y: number; moved: boolean } | null>(null);
  const sizeRef = useRef({ W: 0, H: 0 });
  const netClockRef = useRef(0);
  const stRef = useRef<Record<string, MapJunctionState>>({});
  JUNCTION_IDS.forEach((id) => {
    if (!stRef.current[id]) stRef.current[id] = { phase: 0, interval: 'G', t: 0 };
  });

  const w2s = (x: number, y: number) => [
    (x - camRef.current.x) * zoomRef.current + sizeRef.current.W / 2,
    (y - camRef.current.y) * zoomRef.current + sizeRef.current.H / 2,
  ];
  const s2w = (x: number, y: number) => [
    (x - sizeRef.current.W / 2) / zoomRef.current + camRef.current.x,
    (y - sizeRef.current.H / 2) / zoomRef.current + camRef.current.y,
  ];

  const draw = (now: number) => {
    const cv = opts.cvRef.current;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;
    if (!sizeRef.current.W) {
      const r = cv.getBoundingClientRect();
      sizeRef.current = { W: r.width, H: r.height };
      cv.width = Math.max(1, r.width * window.devicePixelRatio);
      cv.height = Math.max(1, r.height * window.devicePixelRatio);
      ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
    }
    const { W, H } = sizeRef.current;
    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    ctx.fillStyle = isLight ? '#c9c5b7' : '#131519';
    ctx.fillRect(0, 0, W, H);
    const [wx0, wy0] = s2w(0, 0);
    const [wx1, wy1] = s2w(W, H);
    ctx.strokeStyle = '#191c21';
    ctx.lineWidth = Math.max(1, 4 * zoomRef.current);
    for (let x = Math.floor(wx0 / 240) * 240; x <= wx1; x += 240) {
      const p = w2s(x, 0);
      ctx.beginPath();
      ctx.moveTo(p[0], 0);
      ctx.lineTo(p[0], H);
      ctx.stroke();
    }
    for (let y = Math.floor(wy0 / 240) * 240; y <= wy1; y += 240) {
      const p = s2w(0, y);
      ctx.beginPath();
      ctx.moveTo(0, p[1]);
      ctx.lineTo(W, p[1]);
      ctx.stroke();
    }
    for (const [px, py, pw, ph] of PARKS) {
      const a = w2s(px, py);
      const b = w2s(px + pw, py + ph);
      ctx.fillStyle = '#16211b';
      ctx.fillRect(a[0], a[1], b[0] - a[0], b[1] - a[1]);
    }
    const drawPoly = (pts: [number, number][], wd: number, cl: string) => {
      ctx.strokeStyle = cl;
      ctx.lineWidth = wd;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.beginPath();
      const p0 = w2s(pts[0][0], pts[0][1]);
      ctx.moveTo(p0[0], p0[1]);
      for (let i = 1; i < pts.length; i++) {
        const p = w2s(pts[i][0], pts[i][1]);
        ctx.lineTo(p[0], p[1]);
      }
      ctx.stroke();
    };
    for (const r of THIN) drawPoly(r, Math.max(2, 7 * zoomRef.current), '#20242b');
    for (const r of ROADS) drawPoly(r, Math.max(4, 17 * zoomRef.current), '#22262d');
    ctx.setLineDash([10 * zoomRef.current, 12 * zoomRef.current]);
    for (const r of ROADS) drawPoly(r, Math.max(1, 1.4), '#3d434d');
    ctx.setLineDash([]);
    ctx.textBaseline = 'middle';
    for (const id of JUNCTION_IDS) {
      const J = JUNCS[id];
      const s = stRef.current[id];
      const [mx, my] = w2s(J.mapPos.x, J.mapPos.y);
      const col = ivColor(s.interval);
      const pulse = 3 + 2.5 * Math.sin(now * 0.004 + J.mapPos.x * 0.01);
      ctx.strokeStyle = col;
      ctx.lineWidth = 2.2;
      ctx.globalAlpha = 0.9;
      ctx.beginPath();
      ctx.arc(mx, my, (hoverRef.current === id ? 26 : 22) + pulse, 0, 7);
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#f0a63c';
      ctx.beginPath();
      ctx.arc(mx, my, hoverRef.current === id ? 9 : 7, 0, 7);
      ctx.fill();
      ctx.fillStyle = isLight ? '#c9c5b7' : '#131519';
      ctx.beginPath();
      ctx.arc(mx, my, 3, 0, 7);
      ctx.fill();
      const txt = J.code + ' · ' + J.name;
      ctx.font = '600 10px "IBM Plex Mono",monospace';
      const tw = ctx.measureText(txt).width;
      const lx = mx + 20;
      const ly = my - 24;
      ctx.fillStyle = 'rgba(13,14,16,.88)';
      ctx.fillRect(lx - 7, ly - 10, tw + 14, 20);
      ctx.strokeStyle = '#2b2e35';
      ctx.lineWidth = 1;
      ctx.strokeRect(lx - 6.5, ly - 9.5, tw + 13, 19);
      ctx.fillStyle = isLight ? '#1a1a18' : '#e9e6dd';
      ctx.textAlign = 'left';
      ctx.fillText(txt, lx, ly);
      ctx.font = '400 8px "IBM Plex Mono",monospace';
      ctx.fillStyle = '#8b8a84';
      ctx.fillText(J.shape, lx - 7, ly + 16);
    }
    const clockEl = document.getElementById('mapClock');
    if (clockEl) clockEl.textContent = fmtClock(7 * 3600 + netClockRef.current);
  };

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      // Advance each junction's indicator
      for (const id of JUNCTION_IDS) {
        const s = stRef.current[id];
        const J = JUNCS[id];
        s.t += dt;
        const dur =
          s.interval === 'G'
            ? J.phases[s.phase].dur === 'thru' ? 14 : 7
            : s.interval === 'Y' ? 3 : 2;
        if (s.t >= dur) {
          s.t = 0;
          if (s.interval === 'G') s.interval = 'Y';
          else if (s.interval === 'Y') s.interval = 'R';
          else {
            s.interval = 'G';
            s.phase = (s.phase + 1) % J.phases.length;
          }
        }
      }
      netClockRef.current += dt;
      opts.onStateChange({ ...stRef.current });
      draw(now);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const cv = opts.cvRef.current;
    if (!cv) return;
    const onDown = (e: PointerEvent) => {
      dragRef.current = { x: e.clientX, y: e.clientY, moved: false };
      cv.setPointerCapture(e.pointerId);
    };
    const onMove = (e: PointerEvent) => {
      const r = cv.getBoundingClientRect();
      if (dragRef.current) {
        if (Math.hypot(e.clientX - dragRef.current.x, e.clientY - dragRef.current.y) > 4) {
          dragRef.current.moved = true;
        }
        if (dragRef.current.moved) {
          camRef.current.x -= (e.clientX - dragRef.current.x) / zoomRef.current;
          camRef.current.y -= (e.clientY - dragRef.current.y) / zoomRef.current;
          dragRef.current.x = e.clientX;
          dragRef.current.y = e.clientY;
        }
      } else {
        const [wx, wy] = s2w(e.clientX - r.left, e.clientY - r.top);
        let found: string | null = null;
        for (const id of JUNCTION_IDS) {
          const J = JUNCS[id];
          const [mx, my] = w2s(J.mapPos.x, J.mapPos.y);
          if (Math.hypot(mx - (e.clientX - r.left), my - (e.clientY - r.top)) < 34) {
            found = id;
            break;
          }
        }
        hoverRef.current = found;
        cv.style.cursor = found ? 'pointer' : 'grab';
      }
    };
    const onUp = (e: PointerEvent) => {
      // eslint-disable-next-line no-console
      console.log('[map] pointerup', { hasDrag: !!dragRef.current, moved: dragRef.current?.moved });
      if (dragRef.current && !dragRef.current.moved) {
        const r = cv.getBoundingClientRect();
        for (const id of JUNCTION_IDS) {
          const J = JUNCS[id];
          const [mx, my] = w2s(J.mapPos.x, J.mapPos.y);
          if (Math.hypot(mx - (e.clientX - r.left), my - (e.clientY - r.top)) < 34) {
            // eslint-disable-next-line no-console
            console.log('[map] canvas click →', id, 'mx/my=', mx, my, 'client=', e.clientX - r.left, e.clientY - r.top);
            opts.onJunctionClick(id);
            return;
          }
        }
        // eslint-disable-next-line no-console
        console.log('[map] click on canvas but no junction hit');
      }
      dragRef.current = null;
    };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const r = cv.getBoundingClientRect();
      const cx = e.clientX - r.left;
      const cy = e.clientY - r.top;
      const [wx, wy] = s2w(cx, cy);
      const factor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
      zoomRef.current = Math.max(0.4, Math.min(3.2, zoomRef.current * factor));
      camRef.current.x = wx - (cx - sizeRef.current.W / 2) / zoomRef.current;
      camRef.current.y = wy - (cy - sizeRef.current.H / 2) / zoomRef.current;
    };
    cv.addEventListener('pointerdown', onDown);
    cv.addEventListener('pointermove', onMove);
    cv.addEventListener('pointerup', onUp);
    cv.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      cv.removeEventListener('pointerdown', onDown);
      cv.removeEventListener('pointermove', onMove);
      cv.removeEventListener('pointerup', onUp);
      cv.removeEventListener('wheel', onWheel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const cv = opts.cvRef.current;
    if (!cv) return;
    const handler = () => {
      const r = cv.getBoundingClientRect();
      sizeRef.current = { W: r.width, H: r.height };
      cv.width = Math.max(1, r.width * window.devicePixelRatio);
      cv.height = Math.max(1, r.height * window.devicePixelRatio);
      const ctx = cv.getContext('2d');
      ctx?.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
    };
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    zoomIn: () => {
      zoomRef.current = Math.min(3.2, zoomRef.current * 1.3);
    },
    zoomOut: () => {
      zoomRef.current = Math.max(0.4, zoomRef.current / 1.3);
    },
    fit: () => {
      zoomRef.current = 0.85;
      camRef.current = { x: 900, y: 750 };
    },
    destroy: () => {},
  };
}
