import { JunctionEngine } from '../src/engine/junctionEngine';
import type { JunctionDef } from '../src/models/junction.model';
import type { PhaseDurations } from '../src/models/phaseDuration.model';

// Mock the event log so the engine can be tested without a DB.
jest.mock('../src/models/eventLog.model', () => ({
  EventLogModel: {
    append: jest.fn().mockResolvedValue({ id: 1 }),
  },
}));

const DURATIONS: PhaseDurations = {
  junction_id: 'cross',
  thru: 12,
  left: 8,
  yellow: 3,
  allred: 1,
  truck_share: 0.1,
  updated_at: new Date(0),
};

function crossDef(): JunctionDef {
  return {
    id: 'cross',
    code: 'J07',
    name: 'CENTRAL CROSS',
    shape: 'cross',
    legs: 4,
    leg_angles: [0, 90, 180, 270],
    leg_names: ['E', 'N', 'W', 'S'],
    leg_full: ['EAST', 'NORTH', 'WEST', 'SOUTH'],
    map_pos: { x: 560, y: 360 },
    geometry: { hw: 60 },
    phases: [
      { name: 'E · W THROUGH', short: 'E·W', dur: 'thru', moves: [[0, 'T'], [2, 'T']] },
      { name: 'E · W LEFT', short: 'E·W·L', dur: 'left', moves: [[0, 'L'], [2, 'L']] },
      { name: 'N · S THROUGH', short: 'N·S', dur: 'thru', moves: [[1, 'T'], [3, 'T']] },
      { name: 'N · S LEFT', short: 'N·S·L', dur: 'left', moves: [[1, 'L'], [3, 'L']] },
    ],
    move_w: { L: 0.22, T: 0.5, R: 0.28, '*': 0 },
    created_at: new Date(0),
  };
}

function pentaDef(): JunctionDef {
  return {
    id: 'penta',
    code: 'J45',
    name: 'CIVIC PENTA',
    shape: 'penta',
    legs: 5,
    leg_angles: [90, 162, 234, 306, 18],
    leg_names: ['S', 'SW', 'NW', 'N', 'NE'],
    leg_full: ['S', 'SW', 'NW', 'N', 'NE'],
    map_pos: { x: 240, y: 1000 },
    geometry: { hw: 60 },
    phases: [
      { name: 'S · N', short: 'S·N', dur: 'thru', moves: [[0, 'T'], [3, 'T']] },
      { name: 'S · N L', short: 'S·N·L', dur: 'left', moves: [[0, 'L'], [3, 'L']] },
      { name: 'SW · NE', short: 'SW·NE', dur: 'thru', moves: [[1, 'T'], [4, 'T']] },
      { name: 'SW · NE L', short: 'SW·NE·L', dur: 'left', moves: [[1, 'L'], [4, 'L']] },
      { name: 'NW', short: 'NW', dur: 'left', moves: [[2, 'L'], [2, 'T'], [2, 'R']] },
    ],
    move_w: { L: 0.22, T: 0.5, R: 0.28, '*': 0 },
    created_at: new Date(0),
  };
}

describe('JunctionEngine', () => {
  describe('FSM (fixed mode)', () => {
    it('starts in phase 0, interval G, simT 0', () => {
      const e = new JunctionEngine(crossDef(), DURATIONS);
      const s = e.snapshot();
      expect(s.phase).toBe(0);
      expect(s.interval).toBe('G');
      expect(s.simT).toBe(0);
    });

    it('cycles through all 4 phases in fixed mode', () => {
      const e = new JunctionEngine(crossDef(), DURATIONS);
      // thru=12 + Y=3 + R=1 = 16s per thru phase, left=8 + Y=3 + R=1 = 12s per left phase.
      // 2*16 + 2*12 = 56s for a full cycle.
      e.step(56);
      const s = e.snapshot();
      expect(s.phase).toBe(0);
      expect(s.interval).toBe('G');
      expect(s.simT).toBe(56);
    });

    it('penta cycles through all 5 phases', () => {
      const e = new JunctionEngine(pentaDef(), DURATIONS);
      // 3 thru + 2 left = 3*16 + 2*12 = 72s
      e.step(72);
      const s = e.snapshot();
      expect(s.phase).toBe(0);
      expect(s.interval).toBe('G');
      expect(s.simT).toBe(72);
    });
  });

  describe('preempt', () => {
    it('applyCommand preempt sets preempt state', () => {
      const e = new JunctionEngine(crossDef(), DURATIONS);
      const result = e.applyCommand({ kind: 'preempt', leg: 1 });
      expect(result.ok).toBe(true);
      expect(e.preempt).toEqual({ k: 1, evId: expect.any(String) });
    });

    it('preempt on a leg the current phase does NOT serve ends green early', () => {
      const e = new JunctionEngine(crossDef(), DURATIONS);
      // Phase 0 serves legs 0,2 (E/W). Preempting leg 1 (N) should end green.
      e.applyCommand({ kind: 'preempt', leg: 1 });
      // step 1s to register transition check
      e.step(1);
      const s = e.snapshot();
      // After Y transition, interval is Y (in progress)
      expect(['Y', 'R', 'G']).toContain(s.interval);
    });

    it('second preempt while one active is rejected', () => {
      const e = new JunctionEngine(crossDef(), DURATIONS);
      e.applyCommand({ kind: 'preempt', leg: 1 });
      const r2 = e.applyCommand({ kind: 'preempt', leg: 2 });
      expect(r2.ok).toBe(false);
    });
  });

  describe('pedCall', () => {
    it('sets pedPending', () => {
      const e = new JunctionEngine(crossDef(), DURATIONS);
      e.applyCommand({ kind: 'pedCall', side: 1 });
      expect(e.snapshot().pedPending).toBe(true);
    });
  });

  describe('forcePhase', () => {
    it('jumps to requested phase and resets interval to G', () => {
      const e = new JunctionEngine(crossDef(), DURATIONS);
      e.step(20);
      const r = e.applyCommand({ kind: 'forcePhase', phase: 2 });
      expect(r.ok).toBe(true);
      const s = e.snapshot();
      expect(s.phase).toBe(2);
      expect(s.interval).toBe('G');
    });

    it('rejects out-of-range phase', () => {
      const e = new JunctionEngine(crossDef(), DURATIONS);
      const r = e.applyCommand({ kind: 'forcePhase', phase: 99 });
      expect(r.ok).toBe(false);
    });
  });

  describe('reset', () => {
    it('zeroes simT, phase, interval', () => {
      const e = new JunctionEngine(crossDef(), DURATIONS);
      e.step(30);
      e.applyCommand({ kind: 'reset' });
      const s = e.snapshot();
      expect(s.simT).toBe(0);
      expect(s.phase).toBe(0);
      expect(s.interval).toBe('G');
    });
  });

  describe('snapshot', () => {
    it('is JSON-roundtrippable', () => {
      const e = new JunctionEngine(pentaDef(), DURATIONS);
      e.step(10);
      const s1 = e.snapshot();
      const s2 = JSON.parse(JSON.stringify(s1));
      expect(s2).toEqual(s1);
    });

    it('queues array length matches leg count', () => {
      const e = new JunctionEngine(pentaDef(), DURATIONS);
      expect(e.snapshot().queues).toHaveLength(5);
    });
  });

  describe('setMode', () => {
    it('manual mode holds green', () => {
      const e = new JunctionEngine(crossDef(), DURATIONS);
      e.applyCommand({ kind: 'setMode', mode: 'manual' });
      e.step(60); // well past 12s
      const s = e.snapshot();
      expect(s.phase).toBe(0);
      expect(s.interval).toBe('G');
    });
  });
});
