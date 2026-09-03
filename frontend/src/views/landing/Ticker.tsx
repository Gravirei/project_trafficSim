'use client';

import { useEffect } from 'react';

const TERMS = [
  'PHASE 3 · E–W THROUGH',
  'GAP-OUT',
  'ALL-RED CLEARANCE',
  'PROTECTED LEFT',
  'DETECTOR CALL',
  'MAX-OUT',
  'REST-IN-GREEN',
  'PREEMPTION',
  'COORDINATION OFFSET',
  'SATURATION FLOW',
  'RING & BARRIER',
  'DILEMMA ZONE',
  'YIELD-ON-ENTRY',
  'CIRCULATING LANE',
  'SPLIT PHASING',
];

/**
 * Continuous marquee of traffic-control terms. Duplicated once for
 * seamless wrap.
 */
export function Ticker() {
  useEffect(() => {
    const el = document.getElementById('tk');
    if (!el) return;
    const html =
      TERMS.map((t) => `<span>${t}</span><i>◆</i>`).join('') +
      TERMS.map((t) => `<span>${t}</span><i>◆</i>`).join('');
    el.innerHTML = html;
  }, []);

  return (
    <div className="ticker">
      <div className="tkIn" id="tk" />
    </div>
  );
}
