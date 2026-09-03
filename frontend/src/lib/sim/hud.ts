/**
 * HUD update — writes sim state to a bag of DOM refs.
 * Verbatim port of traffic.html lines 1280-1320.
 */

import { compass8, fmtClock } from './helpers';
import { TAGN } from './constants';
import type { SimState, Vehicle } from './types';

export interface HudRefs {
  clock: HTMLElement;
  hudPhase: HTMLElement;
  hudInt: HTMLElement;
  phName: HTMLElement;
  phInt: HTMLElement;
  phRem: HTMLElement;
  phNext: HTMLElement;
  phServe: HTMLElement;
  stServed: HTMLElement;
  stFlow: HTMLElement;
  stAvg: HTMLElement;
  stMax: HTMLElement;
  stripSegments: HTMLElement[];
  queueRows: HTMLElement[];
  sparkCtx: CanvasRenderingContext2D;
  inspector?: HTMLElement;
  iTag?: HTMLElement;
  iType?: HTMLElement;
  iRoute?: HTMLElement;
  iSpd?: HTMLElement;
  iWait?: HTMLElement;
  iDist?: HTMLElement;
}

export function updateHud(S: SimState, refs: HudRefs): void {
  refs.clock.textContent = fmtClock(7 * 3600 + S.simT);
  const ctl = S.ctl;
  const ph = S.J.phases[ctl.phase];
  refs.hudPhase.textContent = 'PHASE ' + (ctl.phase + 1) + ' · ' + ph.name;
  const map: Record<string, [string, string]> = {
    G: ['GREEN', 'cG'],
    Y: ['YELLOW', 'cY'],
    R: ['ALL-RED', 'cR'],
    WALK: ['WALK', 'cP'],
  };
  let [txt, cls] = map[ctl.interval];
  if (ctl.interval === 'G' && ctl.preempt) txt = 'PREEMPT';
  if (ctl.interval === 'G' && ctl.resting) txt = 'REST';
  refs.hudInt.textContent = txt;
  refs.hudInt.className = 'chip ' + cls;
  const dur = ctl.interval === 'G' ? (ph.dur === 'thru' ? S.G.thru : S.G.left) : ctl.interval === 'Y' ? S.G.yellow : ctl.interval === 'R' ? S.G.allred : ctl.pedDur;
  const tIn = ctl.t;
  refs.stripSegments.forEach((el, i) => {
    el.classList.toggle('on', i === ctl.phase);
    const fill = el.querySelector('.tr i') as HTMLElement | null;
    if (fill) {
      fill.style.width = (i === ctl.phase ? Math.max(0, Math.min(1, tIn / dur)) * 100 : 0) + '%';
    }
  });
  refs.phName.textContent = 'PHASE ' + (ctl.phase + 1) + ' — ' + ph.name;
  refs.phInt.textContent = txt;
  refs.phRem.textContent =
    (ctl.preempt || ctl.resting) && ctl.interval === 'G'
      ? 'HOLD'
      : Math.max(0, dur - ctl.t).toFixed(1) + 's';
  refs.phNext.textContent = ctl.preempt
    ? 'HOLD — EV CLEARANCE'
    : 'PHASE ' + (((ctl.phase + 1) % S.J.phases.length) + 1) +
      ' · ' +
      S.J.phases[(ctl.phase + 1) % S.J.phases.length].name;
  refs.phServe.textContent = ph.moves
    .map((m) => {
      if (m[1] === '*') return S.J.legNames[m[0]] + '▸ALL';
      const p = S.mvMap[m[0]][m[1]];
      return S.J.legNames[m[0]] + '▸' + S.J.legNames[p.legB];
    })
    .join('  ');

  refs.queueRows.forEach((el) => {
    const k = +el.dataset.k!;
    const qn = S.vehs.filter(
      (v) => v.path.legA === k && v.s < v.path.stopS && v.v < 12,
    ).length;
    const fill = el.querySelector('.qt i') as HTMLElement | null;
    const cnt = el.querySelector('.qc') as HTMLElement | null;
    if (fill) fill.style.width = Math.min(100, qn * 10) + '%';
    if (cnt) cnt.textContent = String(qn);
    el.classList.toggle('hi', qn >= 8);
  });

  refs.stServed.textContent = String(S.stats.served);
  refs.stFlow.innerHTML = S.exits.filter((t) => t > S.simT - 60).length + '<b>/min</b>';
  refs.stAvg.innerHTML = (S.stats.served ? S.stats.waitSum / S.stats.served : 0).toFixed(1) + '<b>s</b>';
  refs.stMax.innerHTML = S.stats.waitMax.toFixed(1) + '<b>s</b>';

  if (S.sel) {
    if (refs.iSpd) refs.iSpd.textContent = Math.round(S.sel.v * 0.9) + ' km/h';
    if (refs.iWait) refs.iWait.textContent = S.sel.wait.toFixed(1) + ' s';
    if (refs.iDist) refs.iDist.textContent = Math.round(S.sel.s * 0.35) + ' m';
  }
}

export function selectVeh(S: SimState, v: Vehicle | null, refs: HudRefs): void {
  S.sel = v;
  if (refs.inspector) {
    refs.inspector.classList.toggle('hide', !v);
  }
  if (v) {
    if (refs.iTag) refs.iTag.textContent = '#' + String(v.id).padStart(3, '0');
    if (refs.iType)
      refs.iType.textContent = v.type === 'EV' ? 'EMERGENCY' : v.type.toUpperCase();
    if (refs.iRoute)
      refs.iRoute.textContent = S.J.legNames[v.path.legA] + ' ▸ ' + S.J.legNames[v.path.legB];
  }
}

// Suppress unused
void compass8;
void TAGN;
