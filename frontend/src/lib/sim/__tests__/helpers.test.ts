import { describe, it, expect } from 'vitest';
import { clamp, compass8, fmtClock, mulberry } from '../helpers';

describe('clamp', () => {
  it('returns value when in range', () => {
    expect(clamp(5, 0, 10)).toBe(5);
  });
  it('clamps low', () => {
    expect(clamp(-1, 0, 10)).toBe(0);
  });
  it('clamps high', () => {
    expect(clamp(11, 0, 10)).toBe(10);
  });
  it('handles equal endpoints', () => {
    expect(clamp(5, 5, 5)).toBe(5);
  });
});

describe('fmtClock', () => {
  it('formats zero', () => {
    expect(fmtClock(0)).toBe('00:00:00');
  });
  it('formats 7:02:05', () => {
    expect(fmtClock(7 * 3600 + 2 * 60 + 5)).toBe('07:02:05');
  });
  it('formats 23:59:59', () => {
    expect(fmtClock(23 * 3600 + 59 * 60 + 59)).toBe('23:59:59');
  });
  it('pads single digits', () => {
    expect(fmtClock(60 + 7)).toBe('00:01:07');
  });
});

describe('compass8', () => {
  it('returns E for 0deg', () => {
    expect(compass8(0)).toBe('E');
  });
  it('returns SE for 45deg', () => {
    expect(compass8(45)).toBe('SE');
  });
  it('returns S for 90deg', () => {
    expect(compass8(90)).toBe('S');
  });
  it('returns SW for 135deg', () => {
    expect(compass8(135)).toBe('SW');
  });
  it('returns W for 180deg', () => {
    expect(compass8(180)).toBe('W');
  });
  it('returns NW for 225deg', () => {
    expect(compass8(225)).toBe('NW');
  });
  it('returns N for 270deg', () => {
    expect(compass8(270)).toBe('N');
  });
  it('returns NE for 315deg', () => {
    expect(compass8(315)).toBe('NE');
  });
  it('handles negative angles (HTML rounds -45 to NE)', () => {
    // HTML formula: ((Math.round(a/45) % 8) + 8) % 8
    // -45/45 = -1, %8 = -1, +8 = 7 → index 7 = NE
    expect(compass8(-45)).toBe('NE');
  });
});

describe('mulberry', () => {
  it('is deterministic for the same seed', () => {
    const r1 = mulberry(42);
    const r2 = mulberry(42);
    const out1 = [r1(), r1(), r1(), r1(), r1()];
    const out2 = [r2(), r2(), r2(), r2(), r2()];
    expect(out1).toEqual(out2);
  });
  it('returns values in [0, 1)', () => {
    const r = mulberry(1);
    for (let i = 0; i < 100; i++) {
      const v = r();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
  it('produces different sequences for different seeds', () => {
    const a = mulberry(1)();
    const b = mulberry(2)();
    expect(a).not.toBe(b);
  });
});
