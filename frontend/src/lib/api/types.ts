/**
 * Shared types mirroring the backend REST contracts (Phase 4).
 * Keep this in sync with backend/src/routes/{junctions,commands,telemetry}.routes.ts
 * and backend/src/models/{junction,phaseDuration,eventLog}.model.ts.
 */

export type Interval = 'G' | 'Y' | 'R' | 'WALK';
export type Mode = 'fixed' | 'actuated' | 'manual';
export type LogTag = 'phase' | 'ev' | 'ped' | 'mode' | 'sys';

export interface ApiPhase {
  name: string;
  short: string;
  dur: 'thru' | 'left';
  moves: [number, 'L' | 'T' | 'R' | '*'][];
}

export interface ApiJunction {
  id: string;
  code: string;
  name: string;
  shape: 'cross' | 'round' | 'y' | 't' | 'penta';
  legs: number;
  leg_angles: number[];
  leg_names: string[];
  leg_full: string[];
  map_pos: { x: number; y: number };
  geometry: Record<string, number | boolean>;
  phases: ApiPhase[];
  move_w: Record<'L' | 'T' | 'R' | '*', number>;
  created_at: string;
}

export interface ApiSnapshot {
  junctionId: string;
  simT: number;
  phase: number;
  interval: Interval;
  resting: boolean;
  pedPending: boolean;
  pedActive: boolean;
  preempt: { k: number; evId: string } | null;
  queues: number[];
  served: number;
  waitAvg: number;
  waitMax: number;
}

export interface ApiEvent {
  id: number;
  junction_id: string;
  t: number;
  tag: LogTag;
  msg: string;
  recorded_at: string;
}

export interface ApiUser {
  id: number;
  username: string;
  email: string;
  role: 'ADMIN' | 'VIEWER';
}

export interface ApiLoginResponse {
  token: string;
  user: ApiUser;
}

export interface ApiCommandResult {
  ok: boolean;
  reason?: string;
  status?: Record<string, unknown>;
}

export interface ApiSparkPoint {
  t: number;
  v: number;
}
