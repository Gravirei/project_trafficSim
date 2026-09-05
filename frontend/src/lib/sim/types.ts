/**
 * GREENWAVE simulation types.
 * Every interface mirrors the runtime shape used in the HTML prototype.
 * Engine functions mutate `SimState` in place (matching the prototype).
 */

export type Leg = number; // 0..n-1, indexes into JunctionDef.legs
export type Move = 'L' | 'T' | 'R' | '*';
export type Interval = 'G' | 'Y' | 'R' | 'WALK';
export type Mode = 'fixed' | 'actuated' | 'manual';
export type JunctionType = 'cross' | 'round' | 'y' | 't' | 'penta';

export interface Phase {
  name: string;
  short: string;
  dur: 'thru' | 'left';
  moves: [Leg, Move][];
}

export interface JunctionDef {
  id: string;
  code: string;
  name: string;
  shape: string;
  type?: JunctionType;
  legs: number[]; // compass angles
  legNames: string[];
  legFull: string[];
  legLabel: string[];
  // cross / y / t
  hw?: number;
  off0?: number;
  off1?: number;
  rL?: number;
  rR?: number;
  stopD?: number;
  boxR?: number;
  clearR?: number;
  // round-only
  R?: number;
  offA?: number;
  singleLane?: boolean;
  De?: number;
  Dx?: number;
  kM?: number;
  kE?: number;
  moveW: Record<Move, number>;
  phases: Phase[];
  mapPos: { x: number; y: number };
}

export interface PathPoint {
  pts: [number, number][];
  cum: number[];
  total: number;
  cs: number;
  ce: number;
  // round-only extras
  mergeS?: number;
  arcS?: number;
  arcE?: number;
  exitE?: number;
  bmA?: number;
  bxA?: number;
  yieldS?: number;
  slowS: number;
  slowE: number;
  slowV: number;
  mv: Move;
  legA: number;
  legB: number;
  lane: 0 | 1;
  laneId: number;
  stopS: number;
  clearS: number;
}

export type VehicleType = 'car' | 'truck' | 'EV';

export interface Vehicle {
  id: number;
  path: PathPoint;
  mv: Move;
  type: VehicleType;
  color: string;
  len: number;
  w: number;
  desired: number;
  v: number;
  s: number;
  wait: number;
  brk: boolean;
  target: number;
  circAng: number | null;
  laneId: number;
  x: number;
  y: number;
  ang: number;
}

export interface Ped {
  leg: number;
  dir: 1 | -1;
  t: number;
  off: number;
  sp: number;
}

export type LogTag = 'phase' | 'ev' | 'ped' | 'mode' | 'sys';

export interface LogEntry {
  t: string;
  tag: LogTag;
  msg: string;
}

export interface PreemptState {
  k: number;
  evId: number;
}

export interface ControllerState {
  mode: Mode;
  phase: number;
  interval: Interval;
  t: number;
  resting: boolean;
  pedPending: boolean;
  pedActive: boolean;
  pedSide: number;
  pedDur: number;
  preempt: PreemptState | null;
}

export interface SimStats {
  served: number;
  waitSum: number;
  waitMax: number;
}

export interface SimGlobals {
  thru: number;
  left: number;
  yellow: number;
  allred: number;
  truck: number;
  speed: number;
  demand: number[];
}

export interface SimState {
  J: JunctionDef;
  booted: boolean;
  night: boolean;
  paused: boolean;
  inited: boolean;
  G: SimGlobals;
  ctl: ControllerState;
  vehs: Vehicle[];
  peds: Ped[];
  exits: number[];
  vid: number;
  simT: number;
  sel: Vehicle | null;
  lastHud: number;
  stats: SimStats;
  logs: LogEntry[];
  paths: Record<number, Record<number, PathPoint>>;
  mvMap: Record<number, Record<string, PathPoint>>;
  // UI hooks (set by useDeskController)
  onToast?: (msg: string) => void;
}
