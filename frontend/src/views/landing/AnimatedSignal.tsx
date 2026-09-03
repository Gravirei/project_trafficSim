'use client';

import { useEffect } from 'react';

const SIGSEQ: Array<{ k: 'r' | 'y' | 'g'; d: number; cap: string }> = [
  { k: 'r', d: 4, cap: 'STOP · cross traffic clears the box' },
  { k: 'g', d: 4, cap: 'PROCEED · conflict streams separated in time' },
  { k: 'y', d: 1.6, cap: 'PREPARE TO STOP · termination, not acceleration' },
];

/**
 * Animated R/Y/G traffic signal with countdown + caption.
 * Drives the three SVG lamp circles and the .sig-count / .sig-cap
 * elements via direct DOM updates for performance (no React re-render
 * per animation frame).
 */
export function AnimatedSignal() {
  useEffect(() => {
    let sigT = 0;
    let sigI = 0;
    let last = performance.now();
    let raf = 0;
    const tick = () => {
      const now = performance.now();
      const dt = (now - last) / 1000;
      last = now;
      sigT += dt;
      const s = SIGSEQ[sigI];
      if (sigT >= s.d) {
        sigT = 0;
        sigI = (sigI + 1) % SIGSEQ.length;
      }
      const cur = SIGSEQ[sigI];
      const count = (cur.d - sigT).toFixed(1);
      const countEl = document.getElementById('sigCount');
      const capEl = document.getElementById('sigCap');
      if (countEl) countEl.textContent = count;
      if (capEl) capEl.textContent = cur.cap;
      ['hl0', 'hl1', 'hl2'].forEach((id, i) => {
        const el = document.getElementById(id);
        if (!el) return;
        const on = ['r', 'y', 'g'][i] === cur.k;
        el.classList.toggle('on', on);
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <>
      <svg className="sig" viewBox="0 0 120 320" aria-label="Animated traffic signal">
        <rect className="pole" x="56" y="250" width="8" height="62" />
        <rect className="housing" x="14" y="8" width="92" height="242" rx="16" />
        <circle className="lamp lampR" id="hl0" cx="60" cy="60" r="25" />
        <circle className="lamp lampY" id="hl1" cx="60" cy="130" r="25" />
        <circle className="lamp lampG" id="hl2" cx="60" cy="200" r="25" />
      </svg>
      <div className="sigCount" id="sigCount">
        4.0
      </div>
      <div className="sigCap" id="sigCap">
        STOP · cross traffic clears the box
      </div>
    </>
  );
}
