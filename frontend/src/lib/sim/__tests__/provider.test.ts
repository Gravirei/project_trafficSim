import { describe, it, expect, beforeEach } from 'vitest';
import { JUNCTION_IDS, JUNCS } from '../constants';
import { createLocalProvider, _resetLocalProvider } from '../localProvider';
import { createSimState } from '../factory';

describe('LocalProvider', () => {
  beforeEach(() => {
    _resetLocalProvider();
  });

  it('lazy-creates a sim the first time it is queried', () => {
    const p = createLocalProvider();
    expect(p.getState('cross')).toBeNull();
    p.step('cross', 0.1);
    const s = p.getState('cross');
    expect(s).not.toBeNull();
    expect(s!.J.id).toBe('cross');
  });

  it('exposes all four junction ids', () => {
    const p = createLocalProvider();
    for (const id of JUNCTION_IDS) {
      p.step(id, 0.01);
      expect(p.getState(id)).not.toBeNull();
    }
  });

  it('reset zeroes sim state and pushes a log entry', () => {
    const p = createLocalProvider();
    p.step('cross', 5);
    p.reset('cross');
    const s = p.getState('cross')!;
    expect(s.simT).toBe(0);
    expect(s.vehs).toEqual([]);
    expect(s.stats.served).toBe(0);
    expect(s.logs.some((l) => l.msg.includes('RESET'))).toBe(true);
  });

  it('pause toggles paused flag', () => {
    const p = createLocalProvider();
    p.step('cross', 0.01);
    p.pause('cross');
    expect(p.getState('cross')!.paused).toBe(true);
    p.pause('cross');
    expect(p.getState('cross')!.paused).toBe(false);
  });

  it('setMode / setSpeed / setTiming mutate globals', () => {
    const p = createLocalProvider();
    p.step('cross', 0.01);
    p.setMode('cross', 'fixed');
    p.setSpeed('cross', 4);
    p.setTiming('cross', 'thru', 25);
    const s = p.getState('cross')!;
    expect(s.ctl.mode).toBe('fixed');
    expect(s.G.speed).toBe(4);
    expect(s.G.thru).toBe(25);
  });

  it('setDemand updates a per-leg demand', () => {
    const p = createLocalProvider();
    p.step('cross', 0.01);
    p.setDemand('cross', 2, 80);
    expect(p.getState('cross')!.G.demand[2]).toBe(80);
  });

  it('toggleNight flips the night flag', () => {
    const p = createLocalProvider();
    p.step('cross', 0.01);
    expect(p.getState('cross')!.night).toBe(false);
    p.toggleNight('cross');
    expect(p.getState('cross')!.night).toBe(true);
  });

  it('pedCall marks pedPending true and logs', () => {
    const p = createLocalProvider();
    p.step('cross', 0.01);
    p.pedCall('cross');
    const s = p.getState('cross')!;
    expect(s.ctl.pedPending).toBe(true);
    expect(s.logs.some((l) => l.tag === 'ped')).toBe(true);
  });

  it('key handler toggles pause on Space and force-phase on number keys', () => {
    const p = createLocalProvider();
    p.step('cross', 0.01);
    p.getState('cross')!.booted = true; // bypass booted guard
    const e = new KeyboardEvent('keydown', { code: 'Space' });
    p.key('cross', e);
    expect(p.getState('cross')!.paused).toBe(true);
    const e2 = new KeyboardEvent('keydown', { key: '2' });
    p.key('cross', e2);
    expect(p.getState('cross')!.ctl.phase).toBe(1);
  });

  it('frame() with dtReal=0 is a safe no-op when paused/booted=false', () => {
    const p = createLocalProvider();
    p.step('cross', 0.01);
    const before = p.getState('cross')!.simT;
    p.frame('cross', 0, 0);
    expect(p.getState('cross')!.simT).toBe(before);
  });
});
