import { describe, it, expect } from 'vitest';
import { JUNCS, JUNCTION_IDS } from '../constants';
import { buildPaths, formatPhaseServing, resolveMovePath } from '../geometry';
import { createSimState } from '../factory';

describe('phase move resolution', () => {
  for (const id of JUNCTION_IDS) {
    it(`every phase move for ${id} resolves without throwing`, () => {
      const J = JUNCS[id];
      const { paths, mvMap } = buildPaths(J);
      for (const ph of J.phases) {
        const label = formatPhaseServing(J, ph.moves, mvMap, paths);
        expect(typeof label).toBe('string');
        expect(label.length).toBeGreaterThan(0);
        for (const [leg, mv] of ph.moves) {
          if (mv === '*') continue;
          const p = resolveMovePath(mvMap, paths, leg, mv);
          // After multi-leg T classification, phase tables should resolve.
          expect(p, `${id} ${ph.name} leg=${leg} mv=${mv}`).not.toBeNull();
          expect(p!.legA).toBe(leg);
        }
      }
    });
  }

  it('HUD serving string falls back instead of throwing on a missing move', () => {
    const J = JUNCS.cross;
    const { paths, mvMap } = buildPaths(J);
    // Simulate a broken map entry
    delete mvMap[0].T;
    const label = formatPhaseServing(J, [[0, 'T'], [0, 'R']], mvMap, paths);
    expect(label).toContain('S▸');
  });

  it('factory sim state can format every phase serving string', () => {
    for (const id of JUNCTION_IDS) {
      const S = createSimState(JUNCS[id]);
      for (const ph of S.J.phases) {
        expect(() => formatPhaseServing(S.J, ph.moves, S.mvMap, S.paths)).not.toThrow();
      }
    }
  });
});
