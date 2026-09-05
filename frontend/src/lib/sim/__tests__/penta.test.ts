import { describe, it, expect } from 'vitest';
import { JUNCS } from '../constants';
import { createSimState } from '../factory';
import { stepController } from '../controller';
import type { SimState } from '../types';

function fresh(): SimState {
  return createSimState(JUNCS.penta);
}

describe('penta junction (5-way)', () => {
  it('exposes 5 legs and 5 phases', () => {
    const J = JUNCS.penta;
    expect(J.legs.length).toBe(5);
    expect(J.phases.length).toBe(5);
    expect(J.legNames).toHaveLength(5);
  });

  it('has evenly-spaced legs at 72° apart', () => {
    const legs = JUNCS.penta.legs;
    for (let i = 1; i < legs.length; i++) {
      const delta = ((legs[i] - legs[i - 1]) % 360 + 360) % 360;
      expect(delta).toBe(72);
    }
  });

  it('every phase references at least one leg', () => {
    for (const ph of JUNCS.penta.phases) {
      expect(ph.moves.length).toBeGreaterThan(0);
      for (const [leg] of ph.moves) {
        expect(leg).toBeGreaterThanOrEqual(0);
        expect(leg).toBeLessThan(5);
      }
    }
  });

  it('factory initial state matches the 5-leg def', () => {
    const S = fresh();
    expect(S.G.demand.length).toBe(5);
    expect(S.ctl.phase).toBe(0);
    expect(S.ctl.interval).toBe('G');
    expect(Object.keys(S.paths)).toHaveLength(5);
  });

  it('fixed mode cycles through all 5 phases in order', () => {
    const S = fresh();
    S.ctl.mode = 'fixed';
    S.G.thru = 1.5;
    S.G.left = 0.8;
    S.G.yellow = 0.3;
    S.G.allred = 0.3;
    const visited: number[] = [];
    // 5 phases × ~(green + yellow + allred) ≈ 5 × 2.1s = 10.5s; run 150 ticks of 0.1s = 15s
    for (let i = 0; i < 150 && visited.length < 5; i++) {
      stepController(S, 0.1);
      if (S.ctl.interval === 'G' && !visited.includes(S.ctl.phase)) {
        visited.push(S.ctl.phase);
      }
    }
    expect(visited).toEqual([0, 1, 2, 3, 4]);
  });
});
