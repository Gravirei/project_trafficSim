/**
 * Sim state factory.
 * Builds an empty SimState for a junction and attaches path geometry.
 * No DOM, no canvas — that's wired in the view layer.
 */

import { buildPaths } from './geometry';
import { DEFAULT_DURATIONS } from './constants';
import type { JunctionDef, SimState } from './types';

export function createSimState(J: JunctionDef): SimState {
  const n = J.legs.length;
  const { paths, mvMap } = buildPaths(J);
  const S: SimState = {
    J,
    booted: false,
    night: false,
    paused: false,
    inited: true,
    G: {
      thru: DEFAULT_DURATIONS.thru,
      left: DEFAULT_DURATIONS.left,
      yellow: DEFAULT_DURATIONS.yellow,
      allred: DEFAULT_DURATIONS.allred,
      truck: DEFAULT_DURATIONS.truck,
      speed: DEFAULT_DURATIONS.speed,
      demand: J.legs.map((_, i) => DEFAULT_DURATIONS.demand[i % 4]),
    },
    ctl: {
      mode: 'actuated',
      phase: 0,
      interval: 'G',
      t: 0,
      resting: false,
      pedPending: false,
      pedActive: false,
      pedSide: 0,
      pedDur: 8,
      preempt: null,
    },
    vehs: [],
    peds: [],
    exits: [],
    vid: 1,
    simT: 0,
    sel: null,
    lastHud: 0,
    stats: { served: 0, waitSum: 0, waitMax: 0 },
    logs: [],
    paths,
    mvMap,
  };
  return S;
}
