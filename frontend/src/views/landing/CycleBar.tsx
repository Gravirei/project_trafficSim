'use client';

import { useEffect, useRef } from 'react';

const CYC: Array<['N–S THROUGH' | 'YELLOW' | 'ALL-RED' | 'N–S LEFTS' | 'E–W THROUGH' | 'E–W LEFTS', 'G' | 'Y' | 'R', number]> = [
  ['N–S THROUGH', 'G', 14],
  ['YELLOW', 'Y', 3],
  ['ALL-RED', 'R', 2],
  ['N–S LEFTS', 'G', 7],
  ['YELLOW', 'Y', 3],
  ['ALL-RED', 'R', 2],
  ['E–W THROUGH', 'G', 14],
  ['YELLOW', 'Y', 3],
  ['ALL-RED', 'R', 2],
  ['E–W LEFTS', 'G', 7],
  ['YELLOW', 'Y', 3],
  ['ALL-RED', 'R', 2],
];

const CYCD: Record<string, string> = {
  G: 'Conflict streams released together — through and right-turn movements share the green safely.',
  Y: 'Termination interval. A driver too close to stop comfortably may legally proceed; everyone else brakes.',
  R: 'The box empties. Nothing moves while the last vehicle clears — this is the anti right-angle-crash second.',
  L: 'Protected lefts: opposing through traffic is held so left-turners clear without yield or conflict.',
};

const COLORS: Record<'G' | 'Y' | 'R', string> = {
  G: '#1d3a29',
  Y: '#3d3117',
  R: '#3a1d1f',
};

/**
 * Interactive signal cycle bar — hover a segment to inspect,
 * click to seek. Renders the 12 ring steps + group labels.
 */
export function CycleBar() {
  const cycTRef = useRef(0);
  const hoverRef = useRef(-1);

  // Build segments on mount
  useEffect(() => {
    const bar = document.getElementById('cycleBar');
    if (!bar) return;
    const playhead = bar.querySelector('.playhead');
    if (!playhead) return;
    CYC.forEach((c, i) => {
      const d = document.createElement('div');
      d.className = 'cseg';
      d.style.flexGrow = String(c[2]);
      d.style.background = COLORS[c[1]];
      d.title = c[0] + ' · ' + c[2] + 's';
      d.addEventListener('mouseenter', () => (hoverRef.current = i));
      d.addEventListener('mouseleave', () => (hoverRef.current = -1));
      d.addEventListener('click', () => {
        const before = CYC.slice(0, i).reduce((a, x) => a + x[2], 0);
        cycTRef.current = before + 0.01;
      });
      bar.insertBefore(d, playhead);
    });
    const groups = document.getElementById('cycleGroups');
    if (groups) {
      ([
        [0, 6, 'N–S'],
        [6, 12, 'E–W'],
      ] as const).forEach(([start, end, label]) => {
        const d = document.createElement('div');
        d.className = 'cgrp';
        d.style.flexGrow = String(
          CYC.slice(start, end).reduce((a, c) => a + c[2], 0),
        );
        d.textContent = label + ' HALF OF THE RING';
        groups.appendChild(d);
      });
    }
  }, []);

  // rAF tick
  useEffect(() => {
    let last = performance.now();
    let raf = 0;
    const total = CYC.reduce((a, c) => a + c[2], 0);
    const tick = () => {
      const now = performance.now();
      const dt = (now - last) / 1000;
      last = now;
      cycTRef.current = (cycTRef.current + dt) % total;
      let acc = 0;
      let idx = 0;
      for (let i = 0; i < CYC.length; i++) {
        acc += CYC[i][2];
        if (cycTRef.current < acc) {
          idx = i;
          break;
        }
      }
      const playhead = document.getElementById('playhead');
      if (playhead) playhead.style.left = (cycTRef.current / total * 100) + '%';
      const h = hoverRef.current >= 0 ? hoverRef.current : idx;
      const c = CYC[h];
      const start = CYC.slice(0, h).reduce((a, x) => a + x[2], 0);
      const remEl = document.getElementById('cycRem');
      const nameEl = document.getElementById('cycName');
      const descEl = document.getElementById('cycDesc');
      if (remEl) remEl.textContent = Math.max(0, h === idx ? c[2] - (cycTRef.current - start) : c[2]).toFixed(1) + 's';
      if (nameEl) nameEl.textContent = c[0];
      if (descEl) descEl.textContent = (h !== idx ? '(HOVERED — CLICK TO SEEK) ' : '') + (c[0].includes('LEFT') ? CYCD.L : CYCD[c[1]]);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <>
      <div className="cbar" id="cycleBar">
        <div className="playhead" id="playhead" />
      </div>
      <div className="cgrpRow" id="cycleGroups" />
      <div className="readout">
        <span className="iv" id="cycName">
          —
        </span>
        <span className="rem" id="cycRem">
          0.0s
        </span>
        <span className="desc" id="cycDesc">
          —
        </span>
      </div>
      <div className="legend">
        <span>
          <i style={{ background: 'var(--grn)' }} />
          GREEN — MOVEMENT FLOW
        </span>
        <span>
          <i style={{ background: 'var(--yel)' }} />
          YELLOW — TERMINATION
        </span>
        <span>
          <i style={{ background: 'var(--red)' }} />
          ALL-RED — BOX CLEARANCE
        </span>
      </div>
    </>
  );
}
