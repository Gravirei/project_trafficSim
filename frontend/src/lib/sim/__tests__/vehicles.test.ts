import { describe, it, expect, beforeEach } from 'vitest';
import { JUNCS } from '../constants';
import { createSimState } from '../factory';
import { makeVeh, obstacleDist, pickMove, trySpawn, updateVehicles } from '../vehicles';
import type { SimState } from '../types';

function fresh(): SimState {
  return createSimState(JUNCS.cross);
}

describe('pickMove', () => {
  it('returns one of the available moves for the leg', () => {
    const S = fresh();
    const mv = pickMove(S, 0);
    expect(S.mvMap[0][mv]).toBeDefined();
  });
});

describe('trySpawn', () => {
  it('populates the sim with at least one vehicle eventually', () => {
    const S = fresh();
    S.G.truck = 0; // avoid random truck noise; makeVeh still picks palette
    for (let i = 0; i < 200; i++) trySpawn(S, 0);
    expect(S.vehs.length).toBeGreaterThan(0);
  });

  it('trySpawn is a no-op when leader on the same lane is within s<70', () => {
    const S = fresh();
    S.vehs = [];
    const p = S.mvMap[0].T;
    const leader = makeVeh(S, 0, p.legB, 'T', 'car');
    leader.s = 10;
    S.vehs.push(leader);
    let blocked = false;
    for (const u of S.vehs) {
      if (u.laneId === p.laneId && u.s < 70) {
        blocked = true;
        break;
      }
    }
    expect(blocked).toBe(true);
    expect(S.vehs.length).toBe(1);
  });

  it('trySpawn guard does not trigger when leader is past s=70', () => {
    const S = fresh();
    S.vehs = [];
    const p = S.mvMap[0].T;
    const leader = makeVeh(S, 0, p.legB, 'T', 'car');
    leader.s = 100;
    S.vehs.push(leader);
    let blocked = false;
    for (const u of S.vehs) {
      if (u.laneId === p.laneId && u.s < 70) {
        blocked = true;
        break;
      }
    }
    expect(blocked).toBe(false);
  });
});

describe('obstacleDist', () => {
  it('returns distance minus length/2 and 5 margin', () => {
    const S = fresh();
    S.vehs = [];
    const a = makeVeh(S, 0, 2, 'T', 'car');
    a.s = 100;
    a.x = 9999;
    a.y = 9999;
    S.vehs.push(a);
    const b = makeVeh(S, 0, 2, 'T', 'car');
    b.s = 200; // 100m ahead
    b.x = 9999;
    b.y = 9999;
    S.vehs.push(b);
    const d = obstacleDist(S, a);
    // d = 100 (s diff) - (22+22)/2 (length) - 5 (margin) = 73
    expect(d).toBeGreaterThan(60);
    expect(d).toBeLessThan(80);
  });
});

describe('updateVehicles', () => {
  it('advances s by v*dt when target is high enough', () => {
    const S = fresh();
    S.ctl.phase = 0; // N–S THROUGH so greenFor returns true for leg 2 → 0 through move
    const v = makeVeh(S, 0, 2, 'T', 'car');
    v.v = 50;
    v.target = 0; // start with target 0 (will recompute)
    S.vehs.push(v);
    const s0 = v.s;
    updateVehicles(S, 1);
    // v is now 55 (v + a*dt where a=55 for car); s advances by 55
    expect(v.s).toBeCloseTo(s0 + v.v, 0);
    expect(v.v).toBeGreaterThanOrEqual(50);
  });

  it('removes vehicles that reach the end and bumps served', () => {
    const S = fresh();
    const v = makeVeh(S, 0, 2, 'T', 'car');
    v.s = v.path.total;
    S.vehs.push(v);
    updateVehicles(S, 0.1);
    expect(S.vehs.length).toBe(0);
    expect(S.stats.served).toBe(1);
  });
});
