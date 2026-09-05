import { createSimSync } from '../sync';
import type { ApiClient } from '@/lib/api/client';
import type { SimState } from '../types';
import { vi } from 'vitest';

function makeApi() {
  const calls: Array<{ kind: string; body: unknown }> = [];
  const api = {
    command: vi.fn(async (id: string, kind: string, body?: unknown) => {
      calls.push({ kind, body });
      return { ok: true };
    }),
    pushSnapshot: vi.fn(async () => ({ ok: true })),
  };
  return { api: api as unknown as ApiClient, calls };
}

function makeSimState(): SimState {
  return {
    J: {
      id: 'cross',
      code: 'J07',
      name: 'CENTRAL CROSS',
      shape: 'cross',
      legs: [0, 90, 180, 270],
      legNames: ['E', 'N', 'W', 'S'],
      legFull: ['EAST', 'NORTH', 'WEST', 'SOUTH'],
      legLabel: ['E', 'N', 'W', 'S'],
      mapPos: { x: 0, y: 0 },
      hw: 60,
      off0: 0,
      off1: 0,
      rL: 0,
      rR: 0,
      stopD: 80,
      boxR: 0,
      clearR: 0,
      singleLane: false,
      phases: [],
      moveW: { L: 0, T: 1, R: 0, '*': 0 },
    },
    booted: false,
    night: false,
    paused: false,
    inited: true,
    G: { thru: 12, left: 8, yellow: 3, allred: 1, truck: 12, speed: 1, demand: [40, 40, 40, 40] },
    ctl: {
      mode: 'fixed',
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
    paths: { 0: {}, 1: {}, 2: {}, 3: {} } as never,
    mvMap: { 0: {}, 1: {}, 2: {}, 3: {} } as never,
  };
}

describe('createSimSync', () => {
  it('notifyCommand calls api.command with the right kind and body', async () => {
    const { api, calls } = makeApi();
    const sync = createSimSync(makeSimState(), { api });
    await sync.notifyCommand('preempt', { leg: 1 });
    expect(api.command).toHaveBeenCalledWith('cross', 'preempt', { leg: 1 });
    expect(calls).toHaveLength(1);
    sync.destroy();
  });

  it('throttles per-kind: 3 calls in same tick fire only 1', async () => {
    const { api } = makeApi();
    const sync = createSimSync(makeSimState(), { api });
    await sync.notifyCommand('reset');
    await sync.notifyCommand('reset');
    await sync.notifyCommand('reset');
    expect(api.command).toHaveBeenCalledTimes(1);
    sync.destroy();
  });

  it('throttle window is 250ms; a second tick after expiry fires', async () => {
    const { api } = makeApi();
    const sync = createSimSync(makeSimState(), { api, snapshotIntervalMs: 1_000_000 });
    await sync.notifyCommand('preempt', { leg: 0 });
    await new Promise((r) => setTimeout(r, 260));
    await sync.notifyCommand('preempt', { leg: 1 });
    expect(api.command).toHaveBeenCalledTimes(2);
    expect(api.command).toHaveBeenNthCalledWith(2, 'cross', 'preempt', { leg: 1 });
    sync.destroy();
  });

  it('pushSnapshotNow posts a snapshot for the current sim', async () => {
    const { api } = makeApi();
    const S = makeSimState();
    S.simT = 12.5;
    S.ctl.phase = 2;
    S.ctl.interval = 'Y';
    const sync = createSimSync(S, { api, snapshotIntervalMs: 1_000_000 });
    await sync.pushSnapshotNow();
    expect(api.pushSnapshot).toHaveBeenCalledTimes(1);
    const arg = (api.pushSnapshot as unknown as { mock: { calls: Array<[Record<string, unknown>]> } })
      .mock.calls[0][0];
    expect(arg.junctionId).toBe('cross');
    expect(arg.simT).toBe(12.5);
    expect(arg.phase).toBe(2);
    expect(arg.interval).toBe('Y');
    sync.destroy();
  });

  it('destroy is idempotent', () => {
    const { api } = makeApi();
    const sync = createSimSync(makeSimState(), { api });
    sync.destroy();
    expect(() => sync.destroy()).not.toThrow();
  });
});
