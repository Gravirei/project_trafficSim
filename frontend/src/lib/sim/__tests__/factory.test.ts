import { describe, it, expect } from 'vitest';
import { JUNCTION_IDS, JUNCS } from '../constants';
import { createSimState } from '../factory';

describe('createSimState', () => {
  for (const id of JUNCTION_IDS) {
    it(`builds initial state for ${id}`, () => {
      const S = createSimState(JUNCS[id]);
      expect(S.ctl.phase).toBe(0);
      expect(S.ctl.interval).toBe('G');
      expect(S.G.demand.length).toBe(JUNCS[id].legs.length);
      expect(S.vehs).toEqual([]);
      expect(S.exits).toEqual([]);
      expect(S.peds).toEqual([]);
      expect(S.simT).toBe(0);
      expect(S.booted).toBe(false);
      expect(S.paused).toBe(false);
      expect(S.night).toBe(false);
    });
  }

  it('attaches paths and mvMap', () => {
    const S = createSimState(JUNCS.cross);
    expect(S.paths[0][2]).toBeDefined();
    expect(S.mvMap[0]).toBeDefined();
  });
});
