import { describe, it, expect } from 'vitest';
import { JUNCS, JUNCTION_IDS } from '../constants';
import { buildPaths, posAt, project } from '../geometry';

describe('buildPaths', () => {
  for (const id of JUNCTION_IDS) {
    it(`builds paths for ${id}`, () => {
      const J = JUNCS[id];
      const { paths, mvMap } = buildPaths(J);
      const n = J.legs.length;
      for (let a = 0; a < n; a++) {
        expect(paths[a]).toBeDefined();
        for (let b = 0; b < n; b++) {
          if (a === b) continue;
          const p = paths[a][b];
          expect(p).toBeDefined();
          expect(p.total).toBeGreaterThan(0);
          expect(['L', 'T', 'R']).toContain(p.mv);
        }
      }
      // mvMap should have at least one movement per leg
      for (let a = 0; a < n; a++) {
        expect(Object.keys(mvMap[a]).length).toBeGreaterThan(0);
      }
    });
  }

  it('cross junction produces lane=0 for lefts, lane=1 for non-lefts', () => {
    const { paths } = buildPaths(JUNCS.cross);
    for (let a = 0; a < 4; a++) {
      for (let b = 0; b < 4; b++) {
        if (a === b) continue;
        const p = paths[a][b];
        if (p.mv === 'L') expect(p.lane).toBe(0);
        else expect(p.lane).toBe(1);
      }
    }
  });
});

describe('posAt', () => {
  const J = JUNCS.cross;
  const { paths } = buildPaths(J);

  it('returns start point at s=0', () => {
    const p = paths[0][2]; // S -> N
    const r = posAt(p, 0);
    expect(r.x).toBeCloseTo(p.pts[0][0], 1);
    expect(r.y).toBeCloseTo(p.pts[0][1], 1);
  });

  it('returns end point at s=total', () => {
    const p = paths[0][2];
    const r = posAt(p, p.total);
    const last = p.pts[p.pts.length - 1];
    expect(r.x).toBeCloseTo(last[0], 1);
    expect(r.y).toBeCloseTo(last[1], 1);
  });

  it('returns a midpoint with a defined angle', () => {
    const p = paths[0][2];
    const r = posAt(p, p.total / 2);
    expect(typeof r.ang).toBe('number');
    expect(Number.isFinite(r.ang)).toBe(true);
  });
});

describe('project', () => {
  const J = JUNCS.cross;
  const { paths } = buildPaths(J);

  it('returns null for a point very far from the path', () => {
    const p = paths[0][2];
    expect(project(p, -1000, -1000)).toBeNull();
  });

  it('returns a valid s + lat for a point on the path', () => {
    const p = paths[0][2];
    const sample = p.pts[5];
    const r = project(p, sample[0], sample[1]);
    expect(r).not.toBeNull();
    expect(r!.s).toBeGreaterThan(0);
    expect(r!.s).toBeLessThanOrEqual(p.total);
    expect(r!.lat).toBeLessThan(20);
  });
});
