import { describe, it, expect, beforeEach } from 'vitest';
import { JUNCS } from '../constants';
import { createSimState } from '../factory';
import {
  nextPhase,
  planDur,
  preemptFor,
  stepController,
  termGreen,
  startWalk,
} from '../controller';
import { makeVeh } from '../vehicles';
import type { SimState } from '../types';

function fresh(): SimState {
  return createSimState(JUNCS.cross);
}

describe('planDur', () => {
  it('returns thru duration for thru phases', () => {
    const S = fresh();
    S.G.thru = 20;
    S.ctl.phase = 0; // N–S THROUGH (thru)
    expect(planDur(S)).toBe(20);
  });
  it('returns left duration for left phases', () => {
    const S = fresh();
    S.G.left = 8;
    S.ctl.phase = 1; // N–S LEFT (left)
    expect(planDur(S)).toBe(8);
  });
});

describe('fixed mode', () => {
  it('runs green to plan then transitions G→Y', () => {
    const S = fresh();
    S.ctl.mode = 'fixed';
    S.G.thru = 5;
    S.G.yellow = 1;
    S.G.allred = 1;
    // Drain 5.5s of green (10 fixed-mode ticks of 0.5s)
    for (let i = 0; i < 10; i++) stepController(S, 0.5);
    // At t=5.0 the controller termGreens → interval='Y'
    expect(S.ctl.interval).toBe('Y');
  });

  it('transitions Y→R then R→G over time', () => {
    const S = fresh();
    S.ctl.mode = 'fixed';
    S.G.thru = 5;
    S.G.yellow = 1;
    S.G.allred = 1;
    // 5s green (10 ticks) + 1s yellow (2 ticks) = 12 ticks; at tick 13 we're in R
    for (let i = 0; i < 13; i++) stepController(S, 0.5);
    expect(S.ctl.interval).toBe('R');
    // Drain all-red (1s = 2 ticks)
    for (let i = 0; i < 2; i++) stepController(S, 0.5);
    expect(S.ctl.interval).toBe('G');
  });
});

describe('actuated mode', () => {
  beforeEach(() => {
    // Reset Math.random; nothing to do
  });

  it('gap-outs when no demand on the active phase', () => {
    const S = fresh();
    S.ctl.mode = 'actuated';
    S.G.thru = 30;
    S.ctl.t = 10; // past min green
    S.vehs = []; // no demand
    stepController(S, 0.5);
    expect(S.ctl.interval).toBe('Y');
  });

  it('holds green when demand is present', () => {
    const S = fresh();
    S.ctl.mode = 'actuated';
    S.ctl.phase = 0; // N–S THROUGH
    S.G.thru = 30;
    S.ctl.t = 10; // past min green
    // Vehicle within the demand window (s < stopS and s > stopS - 230)
    const v = makeVeh(S, 2, 0, 'T', 'car');
    v.s = v.path.stopS - 50;
    S.vehs.push(v);
    stepController(S, 0.5);
    expect(S.ctl.interval).toBe('G');
  });
});

describe('preemption', () => {
  it('nextPhase resolves to a phase that serves the preempted leg', () => {
    const S = fresh();
    S.ctl.preempt = { k: 1, evId: 1 }; // W leg
    nextPhase(S);
    const ph = S.J.phases[S.ctl.phase];
    expect(ph.moves.some((m) => m[0] === 1)).toBe(true);
  });
});

describe('pedestrian call', () => {
  it('transitions to WALK from R when pedPending and no preempt', () => {
    const S = fresh();
    S.ctl.interval = 'R';
    S.ctl.pedPending = true;
    S.G.allred = 1;
    S.ctl.t = 1;
    stepController(S, 0.2);
    expect(S.ctl.interval).toBe('WALK');
    expect(S.peds.length).toBeGreaterThan(0);
  });
});

describe('nextPhase', () => {
  it('skips empty phases in actuated mode', () => {
    const S = fresh();
    S.ctl.mode = 'actuated';
    S.ctl.phase = 0;
    S.vehs = [];
    nextPhase(S);
    // Phase 0 (N-S THROUGH) had no demand → should skip
    // but phase 2 (E-W THROUGH) also no demand → eventually wraps
    expect(S.ctl.interval).toBe('G');
  });
});

describe('termGreen + startWalk', () => {
  it('termGreen moves to Y', () => {
    const S = fresh();
    termGreen(S);
    expect(S.ctl.interval).toBe('Y');
  });
  it('startWalk spawns pedestrians and switches to WALK', () => {
    const S = fresh();
    startWalk(S);
    expect(S.ctl.interval).toBe('WALK');
    expect(S.peds.length).toBeGreaterThan(0);
  });
});
