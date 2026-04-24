"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { SignalTick } from "@/types";

interface Props {
  signals: SignalTick[] | undefined;
}

// ─── Canvas constants ───────────────────────────────────────────────────────
const W        = 4000;               // logical world width  (px)
const H        = 4000;               // logical world height (px)
const CENTER_X = W / 2;
const CENTER_Y = H / 2;
const RW       = 160;                // total road width (both lanes)
const LW       = RW / 2;            // single lane width

const ROAD_COLOR    = "#1e293b";
const ASPHALT       = "#262f3d";
const GRASS         = "#0d1117";
const MARKING       = "#64748b";
const MARKING_BRIGHT = "#94a3b8";
const CAR_COLORS    = [
  "#ef4444","#3b82f6","#10b981","#f59e0b","#8b5cf6",
  "#ec4899","#e2e8f0","#06b6d4","#f97316","#a78bfa",
  "#14b8a6","#fb923c",
];

const DIR = { NORTH: 0, SOUTH: 1, EAST: 2, WEST: 3 } as const;
type Direction = 0 | 1 | 2 | 3;

const LIGHT_HEX: Record<string, string> = {
  GREEN:  "#10b981",
  YELLOW: "#f59e0b",
  RED:    "#ef4444",
};

// Stop-line positions (where vehicles must wait at red)
const STOP: Record<Direction, number> = {
  [DIR.NORTH]: CENTER_Y + RW / 2 + 10,
  [DIR.SOUTH]: CENTER_Y - RW / 2 - 10,
  [DIR.EAST]:  CENTER_X - RW / 2 - 10,
  [DIR.WEST]:  CENTER_X + RW / 2 + 10,
};

// ─── Vehicle class ──────────────────────────────────────────────────────────
class Vehicle {
  id:       string;
  dir:      Direction;
  x:        number;
  y:        number;
  w:        number;
  h:        number;
  color:    string;
  maxSpeed: number;
  speed:    number;
  stopLine: number;
  bodyVariant: number; // 0-2 — pick a subtle shape variant

  constructor(dir: Direction, spawnOffset: number = 0) {
    this.id         = Math.random().toString(36).slice(2);
    this.dir        = dir;
    this.w          = 24;
    this.h          = 44;
    this.color      = CAR_COLORS[Math.floor(Math.random() * CAR_COLORS.length)];
    this.maxSpeed   = 2.8 + Math.random() * 1.4;
    this.speed      = this.maxSpeed;
    this.stopLine   = STOP[dir];
    this.bodyVariant = Math.floor(Math.random() * 3);

    // Spawn far offscreen on the correct lane
    switch (dir) {
      case DIR.NORTH:
        this.x = CENTER_X + LW / 2;
        this.y = H + this.h + spawnOffset;
        break;
      case DIR.SOUTH:
        this.x = CENTER_X - LW / 2;
        this.y = -this.h - spawnOffset;
        break;
      case DIR.EAST:
        this.x = -this.h - spawnOffset;
        this.y = CENTER_Y + LW / 2;
        break;
      case DIR.WEST:
        this.x = W + this.h + spawnOffset;
        this.y = CENTER_Y - LW / 2;
        break;
    }
  }

  update(dt: number, lightState: string, others: Vehicle[]) {
    const speedScale = dt / 16.66;
    const brakeDist  = 120;
    let   target     = this.maxSpeed;

    // ── 1. Traffic light braking ──────────────────────────────────────────
    if (lightState === "RED" || lightState === "YELLOW") {
      let dist = 0;
      let past = false;
      switch (this.dir) {
        case DIR.NORTH: dist = this.y - this.h / 2 - this.stopLine; past = this.y < this.stopLine; break;
        case DIR.SOUTH: dist = this.stopLine - (this.y + this.h / 2); past = this.y > this.stopLine; break;
        case DIR.EAST:  dist = this.stopLine - (this.x + this.h / 2); past = this.x > this.stopLine; break;
        case DIR.WEST:  dist = this.x - this.h / 2 - this.stopLine;  past = this.x < this.stopLine; break;
      }
      if (!past && dist >= 0 && dist < brakeDist) {
        target = Math.max(0, (dist / brakeDist) * this.maxSpeed);
        if (dist < 5) target = 0;
      }
    }

    // ── 2. Car-following (keep safe gap) ─────────────────────────────────
    let gap = Infinity;
    for (const o of others) {
      if (o.id === this.id || o.dir !== this.dir) continue;
      let d = Infinity;
      switch (this.dir) {
        case DIR.NORTH: if (o.y < this.y) d = this.y - o.y - this.h; break;
        case DIR.SOUTH: if (o.y > this.y) d = o.y - this.y - this.h; break;
        case DIR.EAST:  if (o.x > this.x) d = o.x - this.x - this.h; break;
        case DIR.WEST:  if (o.x < this.x) d = this.x - o.x - this.h; break;
      }
      if (d > 0 && d < gap) gap = d;
    }
    if (gap < brakeDist) {
      target = Math.min(target, Math.max(0, ((gap - 16) / brakeDist) * this.maxSpeed));
    }

    // ── 3. Apply accel / decel ────────────────────────────────────────────
    if (this.speed < target) this.speed = Math.min(target, this.speed + 0.18);
    else if (this.speed > target) this.speed = Math.max(target, this.speed - 0.28);
    if (this.speed < 0.05) this.speed = 0;

    const m = this.speed * speedScale;
    switch (this.dir) {
      case DIR.NORTH: this.y -= m; break;
      case DIR.SOUTH: this.y += m; break;
      case DIR.EAST:  this.x += m; break;
      case DIR.WEST:  this.x -= m; break;
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.translate(this.x, this.y);
    switch (this.dir) {
      case DIR.EAST:  ctx.rotate(Math.PI / 2);  break;
      case DIR.WEST:  ctx.rotate(-Math.PI / 2); break;
      case DIR.SOUTH: ctx.rotate(Math.PI);       break;
    }

    // Shadow
    ctx.shadowColor   = "rgba(0,0,0,0.55)";
    ctx.shadowBlur    = 10;
    ctx.shadowOffsetY = 4;

    // Body
    const r = this.bodyVariant === 0 ? 6 : this.bodyVariant === 1 ? 4 : 8;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.roundRect(-this.w / 2, -this.h / 2, this.w, this.h, r);
    ctx.fill();

    ctx.shadowColor = "transparent";

    // Roof highlight
    ctx.fillStyle = "rgba(255,255,255,0.08)";
    ctx.beginPath();
    ctx.roundRect(-this.w / 2 + 4, -this.h / 2 + 14, this.w - 8, 14, 3);
    ctx.fill();

    // Windshield
    ctx.fillStyle = "#0f172a";
    ctx.beginPath();
    ctx.roundRect(-this.w / 2 + 3, -this.h / 2 + 7, this.w - 6, 9, 2);
    ctx.fill();

    // Rear window
    ctx.beginPath();
    ctx.roundRect(-this.w / 2 + 4, this.h / 2 - 12, this.w - 8, 6, 2);
    ctx.fill();

    // Headlights
    ctx.fillStyle = "#fef08a";
    ctx.beginPath(); ctx.arc(-this.w / 2 + 5, -this.h / 2 + 3, 3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc( this.w / 2 - 5, -this.h / 2 + 3, 3, 0, Math.PI * 2); ctx.fill();

    // Taillights — glow when braking
    const braking = this.speed < this.maxSpeed * 0.5;
    ctx.fillStyle = braking ? "#ff3333" : "#cc2222";
    if (braking) { ctx.shadowColor = "#ef4444"; ctx.shadowBlur = 8; }
    ctx.beginPath(); ctx.arc(-this.w / 2 + 5, this.h / 2 - 3, 3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc( this.w / 2 - 5, this.h / 2 - 3, 3, 0, Math.PI * 2); ctx.fill();
    ctx.shadowColor = "transparent"; ctx.shadowBlur = 0;

    ctx.restore();
  }

  isOutOfBounds(): boolean {
    const margin = 200;
    return this.x < -margin || this.x > W + margin || this.y < -margin || this.y > H + margin;
  }
}

// ─── Draw helpers ───────────────────────────────────────────────────────────

function drawEnvironment(ctx: CanvasRenderingContext2D) {
  // Background — grass/cityscape
  ctx.fillStyle = GRASS;
  ctx.fillRect(0, 0, W, H);

  // Subtle grid (city blocks)
  ctx.strokeStyle = "rgba(255,255,255,0.015)";
  ctx.lineWidth   = 1;
  for (let gx = 0; gx < W; gx += 200) {
    ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke();
  }
  for (let gy = 0; gy < H; gy += 200) {
    ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke();
  }

  // ─── Roads (long in all 4 directions) ─────────────────────────────────
  // Vertical road — full height
  ctx.fillStyle = ASPHALT;
  ctx.fillRect(CENTER_X - RW / 2, 0, RW, H);

  // Horizontal road — full width
  ctx.fillRect(0, CENTER_Y - RW / 2, W, RW);

  // Road edge lines (solid white)
  ctx.strokeStyle = "rgba(255,255,255,0.12)";
  ctx.lineWidth   = 2;
  // Vertical edges
  ctx.beginPath();
  ctx.moveTo(CENTER_X - RW / 2, 0); ctx.lineTo(CENTER_X - RW / 2, H);
  ctx.moveTo(CENTER_X + RW / 2, 0); ctx.lineTo(CENTER_X + RW / 2, H);
  // Horizontal edges
  ctx.moveTo(0, CENTER_Y - RW / 2); ctx.lineTo(W, CENTER_Y - RW / 2);
  ctx.moveTo(0, CENTER_Y + RW / 2); ctx.lineTo(W, CENTER_Y + RW / 2);
  ctx.stroke();

  // ─── Lane divider dashes ──────────────────────────────────────────────
  ctx.strokeStyle = MARKING;
  ctx.lineWidth   = 3;
  ctx.setLineDash([28, 22]);

  // Vertical centre dashes (avoid intersection)
  ctx.beginPath();
  ctx.moveTo(CENTER_X, 0); ctx.lineTo(CENTER_X, CENTER_Y - RW / 2 - 30);
  ctx.moveTo(CENTER_X, CENTER_Y + RW / 2 + 30); ctx.lineTo(CENTER_X, H);
  ctx.stroke();

  // Horizontal centre dashes (avoid intersection)
  ctx.beginPath();
  ctx.moveTo(0, CENTER_Y); ctx.lineTo(CENTER_X - RW / 2 - 30, CENTER_Y);
  ctx.moveTo(CENTER_X + RW / 2 + 30, CENTER_Y); ctx.lineTo(W, CENTER_Y);
  ctx.stroke();
  ctx.setLineDash([]);

  // ─── Intersection box ─────────────────────────────────────────────────
  ctx.fillStyle = ROAD_COLOR;
  ctx.fillRect(CENTER_X - RW / 2, CENTER_Y - RW / 2, RW, RW);

  // Intersection cross guides
  ctx.strokeStyle = "rgba(255,255,255,0.04)";
  ctx.lineWidth   = 1;
  ctx.setLineDash([8, 8]);
  ctx.beginPath();
  ctx.moveTo(CENTER_X, CENTER_Y - RW / 2); ctx.lineTo(CENTER_X, CENTER_Y + RW / 2);
  ctx.moveTo(CENTER_X - RW / 2, CENTER_Y); ctx.lineTo(CENTER_X + RW / 2, CENTER_Y);
  ctx.stroke();
  ctx.setLineDash([]);

  // ─── Stop lines ───────────────────────────────────────────────────────
  ctx.lineWidth   = 6;
  ctx.strokeStyle = MARKING_BRIGHT;
  // Northbound (bottom edge of intersection, right lane)
  ctx.beginPath(); ctx.moveTo(CENTER_X, CENTER_Y + RW / 2); ctx.lineTo(CENTER_X + RW / 2, CENTER_Y + RW / 2); ctx.stroke();
  // Southbound (top edge, left lane)
  ctx.beginPath(); ctx.moveTo(CENTER_X - RW / 2, CENTER_Y - RW / 2); ctx.lineTo(CENTER_X, CENTER_Y - RW / 2); ctx.stroke();
  // Eastbound (left edge, bottom lane)
  ctx.beginPath(); ctx.moveTo(CENTER_X - RW / 2, CENTER_Y); ctx.lineTo(CENTER_X - RW / 2, CENTER_Y + RW / 2); ctx.stroke();
  // Westbound (right edge, top lane)
  ctx.beginPath(); ctx.moveTo(CENTER_X + RW / 2, CENTER_Y - RW / 2); ctx.lineTo(CENTER_X + RW / 2, CENTER_Y); ctx.stroke();

  // ─── Pedestrian crossings ─────────────────────────────────────────────
  ctx.fillStyle = "rgba(255,255,255,0.05)";
  const stripeW = 12;
  const stripeGap = 8;
  const crossDepth = 26;
  // Top
  for (let sx = CENTER_X - RW / 2; sx < CENTER_X + RW / 2; sx += stripeW + stripeGap) {
    ctx.fillRect(sx, CENTER_Y - RW / 2 - crossDepth, stripeW, crossDepth);
  }
  // Bottom
  for (let sx = CENTER_X - RW / 2; sx < CENTER_X + RW / 2; sx += stripeW + stripeGap) {
    ctx.fillRect(sx, CENTER_Y + RW / 2, stripeW, crossDepth);
  }
  // Left
  for (let sy = CENTER_Y - RW / 2; sy < CENTER_Y + RW / 2; sy += stripeW + stripeGap) {
    ctx.fillRect(CENTER_X - RW / 2 - crossDepth, sy, crossDepth, stripeW);
  }
  // Right
  for (let sy = CENTER_Y - RW / 2; sy < CENTER_Y + RW / 2; sy += stripeW + stripeGap) {
    ctx.fillRect(CENTER_X + RW / 2, sy, crossDepth, stripeW);
  }

  // ─── Distance markers along roads (every 200px from center) ───────────
  ctx.font      = "10px 'Fira Code', monospace";
  ctx.fillStyle = "rgba(255,255,255,0.08)";
  ctx.textAlign = "center";
  for (let d = 200; d < H / 2; d += 200) {
    // Up
    ctx.fillText(`${d}m`, CENTER_X - RW / 2 - 20, CENTER_Y - d);
    // Down
    ctx.fillText(`${d}m`, CENTER_X + RW / 2 + 20, CENTER_Y + d);
    // Left
    ctx.fillText(`${d}m`, CENTER_X - d, CENTER_Y - RW / 2 - 12);
    // Right
    ctx.fillText(`${d}m`, CENTER_X + d, CENTER_Y + RW / 2 + 16);
  }
}

function drawTrafficLights(ctx: CanvasRenderingContext2D, states: string[]) {
  const pad    = 40;
  const corner = RW / 2 + pad;

  const poles: [number, number, number, string][] = [
    [CENTER_X - corner, CENTER_Y - corner, Math.PI / 2,  states[1]], // NW → Southbound
    [CENTER_X + corner, CENTER_Y + corner, -Math.PI / 2, states[0]], // SE → Northbound
    [CENTER_X - corner, CENTER_Y + corner, 0,             states[2]], // SW → Eastbound
    [CENTER_X + corner, CENTER_Y - corner, Math.PI,       states[3]], // NE → Westbound
  ];

  for (const [px, py, rot, lightState] of poles) {
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(rot);

    // Pole
    ctx.fillStyle = "#0a0e17";
    ctx.fillRect(-3, 28, 6, 16);

    // Housing
    ctx.fillStyle   = "#0a0e17";
    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth   = 1.5;
    ctx.beginPath();
    ctx.roundRect(-13, -32, 26, 64, 5);
    ctx.fill();
    ctx.stroke();

    // Bulbs
    const bulbs: [number, string][] = [[-18, "RED"], [0, "YELLOW"], [18, "GREEN"]];
    for (const [oy, color] of bulbs) {
      const isActive = lightState === color;
      ctx.beginPath();
      ctx.arc(0, oy, 8, 0, Math.PI * 2);
      ctx.fillStyle = isActive ? LIGHT_HEX[color] : "#1e293b";
      if (isActive) {
        ctx.shadowColor = LIGHT_HEX[color];
        ctx.shadowBlur  = 18;
      }
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.shadowColor = "transparent";

      // Reflective ring
      if (isActive) {
        ctx.strokeStyle = LIGHT_HEX[color];
        ctx.lineWidth   = 1;
        ctx.globalAlpha = 0.3;
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
    }

    ctx.restore();
  }
}

function drawDirectionLabels(ctx: CanvasRenderingContext2D, signals: SignalTick[]) {
  ctx.font      = "bold 13px 'Fira Code', monospace";
  ctx.textAlign = "center";

  const labelOffset = RW / 2 + 70;
  const labels: [number, number, string, number, Direction][] = [
    [CENTER_X, CENTER_Y - labelOffset, signals[0]?.name ?? "North", 0, DIR.NORTH],
    [CENTER_X, CENTER_Y + labelOffset, signals[1]?.name ?? "South", 0, DIR.SOUTH],
    [CENTER_X - labelOffset, CENTER_Y, signals[2]?.name ?? "East", -Math.PI / 2, DIR.EAST],
    [CENTER_X + labelOffset, CENTER_Y, signals[3]?.name ?? "West", Math.PI / 2, DIR.WEST],
  ];

  for (const [x, y, text, rot, dir] of labels) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);

    // Queue count badge
    const q = signals[dir]?.queueLength ?? 0;
    const labelText = text.toUpperCase();

    ctx.fillStyle = "#475569";
    ctx.fillText(labelText, 0, 0);

    // Queue count
    ctx.font = "11px 'Fira Code', monospace";
    ctx.fillStyle = q > 10 ? "#ef4444" : q > 5 ? "#f59e0b" : "#64748b";
    ctx.fillText(`Q: ${q}`, 0, 16);

    ctx.restore();
  }
}

// ─── Mini-map ───────────────────────────────────────────────────────────────
function drawMinimap(
  mapCtx: CanvasRenderingContext2D,
  mapW: number, mapH: number,
  viewX: number, viewY: number, viewW: number, viewH: number,
  vehicles: Vehicle[],
  lightStates: string[],
) {
  const sx = mapW / W;
  const sy = mapH / H;

  mapCtx.clearRect(0, 0, mapW, mapH);

  // Background
  mapCtx.fillStyle = "rgba(13, 17, 23, 0.9)";
  mapCtx.fillRect(0, 0, mapW, mapH);

  // Roads
  mapCtx.fillStyle = "rgba(38, 47, 61, 0.8)";
  mapCtx.fillRect((CENTER_X - RW / 2) * sx, 0, RW * sx, mapH); // vertical
  mapCtx.fillRect(0, (CENTER_Y - RW / 2) * sy, mapW, RW * sy); // horizontal

  // Intersection
  mapCtx.fillStyle = "rgba(30, 41, 59, 0.9)";
  mapCtx.fillRect((CENTER_X - RW / 2) * sx, (CENTER_Y - RW / 2) * sy, RW * sx, RW * sy);

  // Traffic lights on minimap
  const lightPositions: [number, number, number][] = [
    [CENTER_X, CENTER_Y - RW / 2 - 20, 0], // North light
    [CENTER_X, CENTER_Y + RW / 2 + 20, 1], // South light
    [CENTER_X - RW / 2 - 20, CENTER_Y, 2], // East light
    [CENTER_X + RW / 2 + 20, CENTER_Y, 3], // West light
  ];
  for (const [lx, ly, idx] of lightPositions) {
    mapCtx.fillStyle = LIGHT_HEX[lightStates[idx]] ?? "#ef4444";
    mapCtx.beginPath();
    mapCtx.arc(lx * sx, ly * sy, 2.5, 0, Math.PI * 2);
    mapCtx.fill();
  }

  // Vehicles as dots
  for (const v of vehicles) {
    mapCtx.fillStyle = v.color;
    mapCtx.globalAlpha = 0.85;
    mapCtx.beginPath();
    mapCtx.arc(v.x * sx, v.y * sy, 1.5, 0, Math.PI * 2);
    mapCtx.fill();
  }
  mapCtx.globalAlpha = 1;

  // Viewport rectangle
  mapCtx.strokeStyle = "#3b82f6";
  mapCtx.lineWidth   = 1.5;
  mapCtx.strokeRect(viewX * sx, viewY * sy, viewW * sx, viewH * sy);

  // Border
  mapCtx.strokeStyle = "rgba(255,255,255,0.15)";
  mapCtx.lineWidth   = 1;
  mapCtx.strokeRect(0, 0, mapW, mapH);
}

// ─── Module-level state to persist across tab/route shifts ────────────────────
const persistedVisualizerState = {
  vehicles: [] as Vehicle[],
  spawnTimers: [0, 0, 0, 0],
  transform: { scale: 0, panX: 0, panY: 0 },
};

// ─── React Component ─────────────────────────────────────────────────────────
export default function IntersectionVisualizer({ signals }: Props) {
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const minimapRef   = useRef<HTMLCanvasElement>(null);
  const signalsRef   = useRef<SignalTick[] | undefined>(signals);
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapRef      = useRef<HTMLDivElement>(null);
  const transform    = useRef(
    persistedVisualizerState.transform.scale > 0 
      ? { ...persistedVisualizerState.transform } 
      : { scale: 1, panX: 0, panY: 0 }
  );
  const dragging     = useRef<{ sx: number; sy: number; spx: number; spy: number } | null>(null);
  const [zoomLevel, setZoomLevel] = useState(
    persistedVisualizerState.transform.scale > 0
      ? Math.round(persistedVisualizerState.transform.scale * 100)
      : 100
  );

  useEffect(() => {
    signalsRef.current = signals;
  }, [signals]);

  const applyTransform = useCallback(() => {
    if (!wrapRef.current) return;
    const { scale, panX, panY } = transform.current;
    wrapRef.current.style.transform = `translate(${panX}px, ${panY}px) scale(${scale})`;
    setZoomLevel(Math.round(scale * 100));
    persistedVisualizerState.transform = { scale, panX, panY };
  }, []);

  // ── Animation loop ────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
    if (!ctx) return;

    const vehicles = persistedVisualizerState.vehicles;
    const spawnTimers = persistedVisualizerState.spawnTimers;
    const MAX_PER_DIR = 60; // allow many more vehicles on long roads

    let lastTime = 0;
    let animId   = 0;

    function getLightState(dir: Direction): string {
      const sigs = signalsRef.current;
      if (!sigs || !sigs[dir]) return "RED";
      return sigs[dir].state;
    }

    function getArrivalRate(dir: Direction): number {
      const sigs = signalsRef.current;
      if (!sigs || !sigs[dir]) return 0.3;
      return Math.max(0.05, sigs[dir].arrivalRate);
    }

    function getQueueLength(dir: Direction): number {
      const sigs = signalsRef.current;
      if (!sigs || !sigs[dir]) return 5;
      return sigs[dir].queueLength;
    }

    function trySpawn(dir: Direction) {
      const queueLen = getQueueLength(dir);
      // Scale cap proportionally: more queue → allow more vehicles on the road
      const cap = Math.min(MAX_PER_DIR, Math.max(8, queueLen + 6));

      const inDir = vehicles.filter(v => v.dir === dir).length;
      if (inDir >= cap) return;

      const newV = new Vehicle(dir);
      let blocked = false;
      for (const v of vehicles) {
        if (v.dir !== dir) continue;
        let d = Infinity;
        switch (dir) {
          case DIR.NORTH: d = Math.abs(v.y - (H + newV.h)); break;
          case DIR.SOUTH: d = Math.abs(v.y - (-newV.h)); break;
          case DIR.EAST:  d = Math.abs(v.x - (-newV.h)); break;
          case DIR.WEST:  d = Math.abs(v.x - (W + newV.h)); break;
        }
        if (d < 80) { blocked = true; break; }
      }
      if (!blocked) vehicles.push(newV);
    }

    function loop(ts: number) {
      if (!lastTime) lastTime = ts;
      const dt = Math.min(ts - lastTime, 50);
      lastTime = ts;

      for (let dir = 0; dir < 4; dir++) {
        spawnTimers[dir] += dt;
        const interval = 1000 / getArrivalRate(dir as Direction);
        if (spawnTimers[dir] >= interval) {
          trySpawn(dir as Direction);
          spawnTimers[dir] = 0;
        }
      }

      for (let i = vehicles.length - 1; i >= 0; i--) {
        const v = vehicles[i];
        v.update(dt, getLightState(v.dir), vehicles);
        if (v.isOutOfBounds()) vehicles.splice(i, 1);
      }

      ctx.clearRect(0, 0, W, H);
      drawEnvironment(ctx);
      drawTrafficLights(ctx, [0, 1, 2, 3].map(d => getLightState(d as Direction)));

      const sigs = signalsRef.current;
      if (sigs && sigs.length >= 4) drawDirectionLabels(ctx, sigs);

      // Sort by Y for proper depth ordering
      vehicles.sort((a, b) => a.y - b.y);
      vehicles.forEach(v => v.draw(ctx));

      // ─── Update minimap ────────────────────────────────────────────────
      const miniCanvas = minimapRef.current;
      if (miniCanvas) {
        const mapCtx = miniCanvas.getContext("2d");
        if (mapCtx) {
          const el = containerRef.current;
          const { scale, panX, panY } = transform.current;
          const cw = el?.clientWidth ?? 800;
          const ch = el?.clientHeight ?? 500;
          // Calculate what portion of the world is visible
          const viewX = -panX / scale;
          const viewY = -panY / scale;
          const viewW = cw / scale;
          const viewH = ch / scale;
          drawMinimap(
            mapCtx, miniCanvas.width, miniCanvas.height,
            viewX, viewY, viewW, viewH,
            vehicles,
            [0, 1, 2, 3].map(d => getLightState(d as Direction)),
          );
        }
      }

      animId = requestAnimationFrame(loop);
    }

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, []);

  // ── Pan / Zoom ────────────────────────────────────────────────────────────
  useEffect(() => {
    const el  = containerRef.current;
    const wrap = wrapRef.current;
    if (!el || !wrap) return;

    if (persistedVisualizerState.transform.scale === 0) {
      // Fit to show the intersection centred with some context roads only initially
      const cw = el.clientWidth;
      const ch = el.clientHeight;
      const viewSize = 1200;
      const initialScale = Math.min(cw, ch) / viewSize;
      transform.current = {
        scale: initialScale,
        panX: cw / 2 - CENTER_X * initialScale,
        panY: ch / 2 - CENTER_Y * initialScale,
      };
    }
    applyTransform();

    function onWheel(e: WheelEvent) {
      e.preventDefault();
      const rect = el!.getBoundingClientRect();
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;
      const { scale, panX, panY } = transform.current;
      const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12;
      const newScale = Math.max(0.06, Math.min(4, scale * factor));
      const ratio = newScale / scale;
      transform.current = {
        scale: newScale,
        panX: cx - (cx - panX) * ratio,
        panY: cy - (cy - panY) * ratio,
      };
      applyTransform();
    }

    function onMouseDown(e: MouseEvent) {
      dragging.current = { sx: e.clientX, sy: e.clientY, spx: transform.current.panX, spy: transform.current.panY };
      el!.style.cursor = "grabbing";
    }

    function onMouseMove(e: MouseEvent) {
      if (!dragging.current) return;
      transform.current.panX = dragging.current.spx + (e.clientX - dragging.current.sx);
      transform.current.panY = dragging.current.spy + (e.clientY - dragging.current.sy);
      applyTransform();
    }

    function onMouseUp() {
      dragging.current = null;
      el!.style.cursor = "grab";
    }

    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    return () => {
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [applyTransform]);

  function resetView() {
    const el = containerRef.current;
    if (!el) return;
    const cw = el.clientWidth;
    const ch = el.clientHeight;
    const viewSize = 1200;
    const initialScale = Math.min(cw, ch) / viewSize;
    transform.current = {
      scale: initialScale,
      panX: cw / 2 - CENTER_X * initialScale,
      panY: ch / 2 - CENTER_Y * initialScale,
    };
    applyTransform();
  }

  function zoomIn() {
    const el = containerRef.current;
    if (!el) return;
    const cw = el.clientWidth;
    const ch = el.clientHeight;
    const cx = cw / 2;
    const cy = ch / 2;
    const { scale, panX, panY } = transform.current;
    const newScale = Math.min(4, scale * 1.3);
    const ratio = newScale / scale;
    transform.current = { scale: newScale, panX: cx - (cx - panX) * ratio, panY: cy - (cy - panY) * ratio };
    applyTransform();
  }

  function zoomOut() {
    const el = containerRef.current;
    if (!el) return;
    const cw = el.clientWidth;
    const ch = el.clientHeight;
    const cx = cw / 2;
    const cy = ch / 2;
    const { scale, panX, panY } = transform.current;
    const newScale = Math.max(0.06, scale / 1.3);
    const ratio = newScale / scale;
    transform.current = { scale: newScale, panX: cx - (cx - panX) * ratio, panY: cy - (cy - panY) * ratio };
    applyTransform();
  }

  return (
    <div className="glass-panel" style={{ padding: "1rem", height: "560px", display: "flex", flexDirection: "column" }}>
      {/* Header toolbar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem", flexShrink: 0 }}>
        <span className="metrics-label" style={{ fontSize: "0.75rem", letterSpacing: "0.12em" }}>
          LIVE INTERSECTION VIEW
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span style={{ fontSize: "0.6rem", color: "var(--text-secondary)", fontFamily: "var(--font-fira-code)" }}>
            scroll to zoom · drag to pan
          </span>

          {/* Zoom controls */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
            <button
              onClick={zoomOut}
              className="btn"
              style={{ fontSize: "0.7rem", padding: "0.15rem 0.4rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "var(--text-secondary)", borderRadius: "4px", cursor: "pointer", lineHeight: 1 }}
            >
              −
            </button>
            <span style={{ fontSize: "0.6rem", color: "var(--text-secondary)", fontFamily: "var(--font-fira-code)", width: "3rem", textAlign: "center" }}>
              {zoomLevel}%
            </span>
            <button
              onClick={zoomIn}
              className="btn"
              style={{ fontSize: "0.7rem", padding: "0.15rem 0.4rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "var(--text-secondary)", borderRadius: "4px", cursor: "pointer", lineHeight: 1 }}
            >
              +
            </button>
          </div>

          <button
            onClick={resetView}
            className="btn"
            style={{ fontSize: "0.65rem", padding: "0.2rem 0.5rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "var(--text-secondary)", borderRadius: "4px", cursor: "pointer" }}
          >
            reset view
          </button>
          <span style={{ fontSize: "0.65rem", color: "var(--text-secondary)", fontFamily: "var(--font-fira-code)" }}>
            4-WAY · TOP-DOWN
          </span>
        </div>
      </div>

      {/* Main viewport */}
      <div
        ref={containerRef}
        style={{
          flex: 1,
          overflow: "hidden",
          borderRadius: "8px",
          cursor: "grab",
          background: "rgba(0,0,0,0.3)",
          position: "relative",
        }}
      >
        <div
          ref={wrapRef}
          style={{ transformOrigin: "0 0", display: "inline-block", lineHeight: 0 }}
        >
          <canvas
            ref={canvasRef}
            width={W}
            height={H}
            style={{ display: "block" }}
          />
        </div>

        {/* Mini-map navigator (bottom right) */}
        <div
          style={{
            position: "absolute",
            bottom: 12,
            right: 12,
            borderRadius: "6px",
            overflow: "hidden",
            border: "1px solid rgba(255,255,255,0.12)",
            boxShadow: "0 4px 16px rgba(0,0,0,0.5)",
            background: "rgba(13, 17, 23, 0.85)",
            backdropFilter: "blur(8px)",
          }}
        >
          <canvas
            ref={minimapRef}
            width={140}
            height={140}
            style={{ display: "block" }}
          />
        </div>

        {/* Compass rose (top right) */}
        <div style={{
          position: "absolute",
          top: 12,
          right: 12,
          width: 44,
          height: 44,
          borderRadius: "50%",
          background: "rgba(13, 17, 23, 0.75)",
          border: "1px solid rgba(255,255,255,0.1)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backdropFilter: "blur(8px)",
        }}>
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            {/* N */}
            <text x="14" y="7" textAnchor="middle" fill="#94a3b8" fontSize="7" fontWeight="bold" fontFamily="monospace">N</text>
            {/* Arrow up */}
            <path d="M14 8 L12.5 12 L15.5 12 Z" fill="#ef4444" />
            {/* Arrow down */}
            <path d="M14 20 L12.5 16 L15.5 16 Z" fill="#475569" />
            {/* Arrow left */}
            <path d="M8 14 L12 12.5 L12 15.5 Z" fill="#475569" />
            {/* Arrow right */}
            <path d="M20 14 L16 12.5 L16 15.5 Z" fill="#475569" />
          </svg>
        </div>
      </div>
    </div>
  );
}
