/**
 * Sim constants + junction definitions.
 * Verbatim port of traffic.html lines 636-679, 791-797.
 * No imports from React or DOM.
 */

import type { JunctionDef } from './types';
import { RAD } from './helpers';

export { RAD };

/** Logical world units for the simulation canvas. */
export const SP = 510;
export const SZ = 900;

/** Vehicle color palette. */
export const PALETTE = [
  '#cdd2d6',
  '#aeb4ba',
  '#7c828a',
  '#3c4148',
  '#8f3b3b',
  '#33523f',
  '#2f4a63',
  '#dad7cf',
  '#5d4668',
  '#27343d',
];

/** Truck color palette. */
export const TRUCKC = ['#8e9299', '#5d6167', '#7a6a53', '#a8a396', '#4a4e55'];

/** Log-tag display names. */
export const TAGN: Record<string, string> = {
  phase: 'PHASE',
  ev: 'PREEMPT',
  ped: 'PED',
  mode: 'MODE',
  sys: 'SYS',
};

/** Mode-specific UI hint copy. */
export const HINTS: Record<string, string> = {
  fixed: 'Fixed-time: every phase runs its full planned green regardless of demand — predictable, coordination-friendly.',
  actuated:
    'Actuated: detectors extend green while demand keeps arriving; the phase gap-outs or max-outs on its own.',
  manual:
    'Manual: green holds on the current phase until you advance it. Yellow and all-red still run automatically.',
};

/** Leg labels for 4-way junctions. */
export const LEGFULL4 = [
  'SOUTH APPROACH · NB',
  'WEST APPROACH · EB',
  'NORTH APPROACH · SB',
  'EAST APPROACH · WB',
];
export const LEGLAB4 = [
  'S · NORTHBOUND ▲',
  'W · EASTBOUND ▶',
  'N · SOUTHBOUND ▼',
  'E · WESTBOUND ◀',
];

/** Animation cadence constants used by controllers/UI. */
export const HUD_THROTTLE_MS = 110;
export const BOOT_LINE_INTERVAL_MS = 120;
export const BOOT_HOLD_AFTER_LAST_MS = 420;

/** Pre-known plan durations for HUD timeRemaining formatting. */
export const DEFAULT_DURATIONS = {
  thru: 14,
  left: 7,
  yellow: 3,
  allred: 2,
  truck: 12,
  speed: 1,
  demand: [40, 35, 45, 30],
};

/** Junction definitions — HTML lines 638-679. */
export const JUNCS: Record<string, JunctionDef> = {
  cross: {
    id: 'cross',
    code: 'J07',
    name: 'CENTRAL CROSS',
    shape: 'CROSS · 4 APPROACHES',
    legs: [90, 180, 270, 0],
    legNames: ['S', 'W', 'N', 'E'],
    legFull: LEGFULL4,
    legLabel: LEGLAB4,
    hw: 68,
    off0: 17,
    off1: 51,
    rL: 100,
    rR: 38,
    stopD: 96,
    boxR: 70,
    clearR: 104,
    moveW: { L: 0.18, T: 0.6, R: 0.22, '*': 0 },
    phases: [
      { name: 'N–S THROUGH', short: 'NS·T', dur: 'thru', moves: [[2, 'T'], [2, 'R'], [0, 'T'], [0, 'R']] },
      { name: 'N–S LEFT', short: 'NS·L', dur: 'left', moves: [[2, 'L'], [0, 'L']] },
      { name: 'E–W THROUGH', short: 'EW·T', dur: 'thru', moves: [[1, 'T'], [1, 'R'], [3, 'T'], [3, 'R']] },
      { name: 'E–W LEFT', short: 'EW·L', dur: 'left', moves: [[1, 'L'], [3, 'L']] },
    ],
    mapPos: { x: 560, y: 360 },
  },
  round: {
    id: 'round',
    code: 'J12',
    name: 'RING PLAZA',
    shape: 'ROUNDABOUT · SIGNALIZED ENTRIES',
    type: 'round',
    legs: [90, 180, 270, 0],
    legNames: ['S', 'W', 'N', 'E'],
    legFull: LEGFULL4,
    legLabel: LEGLAB4,
    hw: 40,
    offA: 20,
    singleLane: true,
    R: 88,
    stopD: 150,
    boxR: 120,
    clearR: 150,
    De: 112,
    Dx: 135,
    kM: 22,
    kE: 28,
    moveW: { L: 0.25, T: 0.45, R: 0.3, '*': 0 },
    phases: [
      { name: 'N+S ENTRIES', short: 'N+S', dur: 'thru', moves: [[2, '*'], [0, '*']] },
      { name: 'E+W ENTRIES', short: 'E+W', dur: 'thru', moves: [[1, '*'], [3, '*']] },
    ],
    mapPos: { x: 1300, y: 360 },
  },
  y: {
    id: 'y',
    code: 'J21',
    name: 'MERIDIAN SPLIT',
    shape: 'Y-JUNCTION · 3 LEGS · 120°',
    legs: [90, 210, 330],
    legNames: ['S', 'NW', 'NE'],
    legFull: ['SOUTH STEM · NB', 'NORTHWEST LEG · INBOUND', 'NORTHEAST LEG · INBOUND'],
    legLabel: ['S · NORTHBOUND ▲', 'NW · INBOUND ▸', 'NE · INBOUND ▂'],
    hw: 60,
    off0: 15,
    off1: 45,
    rL: 96,
    rR: 36,
    stopD: 92,
    boxR: 64,
    clearR: 100,
    moveW: { L: 0.5, T: 0, R: 0.5, '*': 0 },
    phases: [
      { name: 'S LEFT · SIDES', short: 'S·L', dur: 'left', moves: [[0, 'L'], [1, 'R'], [2, 'R']] },
      { name: 'NW LEFT · SIDES', short: 'NW·L', dur: 'left', moves: [[1, 'L'], [2, 'R'], [0, 'R']] },
      { name: 'NE LEFT · SIDES', short: 'NE·L', dur: 'left', moves: [[2, 'L'], [0, 'R'], [1, 'R']] },
    ],
    mapPos: { x: 900, y: 800 },
  },
  t: {
    id: 't',
    code: 'J33',
    name: 'HARBOR TEE',
    shape: 'T-JUNCTION · SIDE STREET',
    legs: [90, 180, 270],
    legNames: ['S', 'W', 'N'],
    legFull: ['SOUTH APPROACH · NB', 'WEST STEM · EB', 'NORTH APPROACH · SB'],
    legLabel: ['S · NORTHBOUND ▲', 'W · EASTBOUND ▶', 'N · SOUTHBOUND ▼'],
    hw: 68,
    off0: 17,
    off1: 51,
    rL: 100,
    rR: 38,
    stopD: 96,
    boxR: 70,
    clearR: 104,
    moveW: { L: 0.3, T: 0.55, R: 0.15, '*': 0 },
    phases: [
      { name: 'S–N THROUGH', short: 'THRU', dur: 'thru', moves: [[0, 'T'], [2, 'T'], [2, 'R']] },
      { name: 'S LEFT · W RIGHT', short: 'S·L', dur: 'left', moves: [[0, 'L'], [1, 'R']] },
      { name: 'W PROTECTED', short: 'W·P', dur: 'left', moves: [[1, 'L'], [1, 'R']] },
    ],
    mapPos: { x: 900, y: 1160 },
  },
  penta: {
    id: 'penta',
    code: 'J45',
    name: 'CIVIC PENTA',
    shape: '5-WAY INTERSECTION · 72°',
    legs: [90, 162, 234, 306, 18],
    legNames: ['S', 'SW', 'NW', 'N', 'NE'],
    legFull: [
      'SOUTH APPROACH · NB',
      'SOUTHWEST LEG · INBOUND',
      'NORTHWEST LEG · INBOUND',
      'NORTH APPROACH · SB',
      'NORTHEAST LEG · INBOUND',
    ],
    legLabel: [
      'S · NORTHBOUND ▲',
      'SW · INBOUND ▸',
      'NW · INBOUND ◀',
      'N · SOUTHBOUND ▼',
      'NE · INBOUND ▂',
    ],
    hw: 60,
    off0: 15,
    off1: 45,
    rL: 92,
    rR: 34,
    stopD: 92,
    boxR: 64,
    clearR: 100,
    moveW: { L: 0.22, T: 0.5, R: 0.28, '*': 0 },
    phases: [
      { name: 'S · N THROUGH', short: 'S·N', dur: 'thru', moves: [[0, 'T'], [0, 'R'], [3, 'T'], [3, 'R']] },
      { name: 'S · N LEFT', short: 'S·N·L', dur: 'left', moves: [[0, 'L'], [3, 'L']] },
      { name: 'SW · NE', short: 'SW·NE', dur: 'thru', moves: [[1, 'T'], [1, 'R'], [4, 'T'], [4, 'R']] },
      { name: 'SW · NE LEFT', short: 'SW·NE·L', dur: 'left', moves: [[1, 'L'], [4, 'L']] },
      { name: 'NW APPROACH', short: 'NW', dur: 'left', moves: [[2, 'L'], [2, 'T'], [2, 'R']] },
    ],
    mapPos: { x: 240, y: 1000 },
  },
};

/** Sortable list of junction ids (used by hash routing + map sidebar). */
export const JUNCTION_IDS = Object.keys(JUNCS);
