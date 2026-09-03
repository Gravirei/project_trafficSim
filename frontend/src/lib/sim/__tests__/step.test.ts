import { describe, it, expect } from 'vitest';
import { JUNCS } from '../constants';
import { createSimState } from '../factory';
import { step } from '../step';

describe('step', () => {
  it('increments simT by dt', () => {
    const S = createSimState(JUNCS.cross);
    S.G.demand = [0, 0, 0, 0]; // no spawning to keep test deterministic
    step(S, 1.0);
    expect(S.simT).toBeCloseTo(1.0, 5);
    step(S, 0.5);
    expect(S.simT).toBeCloseTo(1.5, 5);
  });

  it('does not crash on a freshly-created sim', () => {
    const S = createSimState(JUNCS.cross);
    expect(() => {
      for (let i = 0; i < 60; i++) step(S, 0.05);
    }).not.toThrow();
  });
});
