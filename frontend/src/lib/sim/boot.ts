/**
 * Boot overlay sequencer.
 * Verbatim port of traffic.html lines 1332-1361.
 */

import { BOOT_HOLD_AFTER_LAST_MS, BOOT_LINE_INTERVAL_MS } from './constants';
import type { JunctionDef } from './types';

export function bootLinesFor(J: JunctionDef): string[] {
  const n = J.legs.length;
  return [
    'GREENWAVE CONTROLLER · GW-4400 REV 2.1',
    `SITE ${J.code} — ${J.name}`,
    J.shape,
    'CPU 4.10 MHz ................ OK',
    'MEMORY 512K ................. OK',
    `DETECTOR BANK (${n * 2} LOOPS) ...... OK`,
    `SIGNAL RING · ${J.phases.length} PHASES ...... LOADED`,
    'CONFLICT MONITOR ............ CLEAR',
    `${J.code} ....................... ONLINE`,
  ];
}

export interface BootOpts {
  /** Element that gets the boot text inserted. */
  text: HTMLElement;
  /** Called once the boot animation completes (or is skipped). */
  onDone: () => void;
  /** Pre-computed boot lines; pass bootLinesFor(J). */
  lines: string[];
}

/**
 * Drives the sequential OK-line boot animation.
 * Returns a `cancel()` function to abort mid-boot.
 */
export function startBootOverlay(opts: BootOpts): () => void {
  const { text, onDone, lines } = opts;
  text.innerHTML = '';
  let i = 0;
  let cancelled = false;
  const tick = () => {
    if (cancelled) return;
    if (i < lines.length) {
      text.innerHTML += (i ? '\n' : '') + lines[i];
      i++;
      setTimeout(tick, BOOT_LINE_INTERVAL_MS);
    } else {
      setTimeout(() => {
        if (!cancelled) onDone();
      }, BOOT_HOLD_AFTER_LAST_MS);
    }
  };
  tick();
  return () => {
    cancelled = true;
  };
}
