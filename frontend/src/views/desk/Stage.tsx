'use client';

import { RefObject } from 'react';
import { SZ } from '@/lib/sim';
import styles from './DeskView.module.css';

export function Stage({ cvRef }: { cvRef: RefObject<HTMLCanvasElement | null> }) {
  return (
    <section className={styles.stage} role="region" aria-label="Simulation stage">
      <canvas ref={cvRef} width={SZ} height={SZ} className={styles.canvas} />
      <div className={styles.hud}>
        <span className={styles.chip} id="hudPhase">
          —
        </span>
        <span className={`${styles.chip} ${styles.cG}`} id="hudInt">
          GREEN
        </span>
      </div>
      <span
        className={`${styles.chip} ${styles.cE} ${styles.pausedChip} hide`}
        id="pausedChip"
        role="status"
      >
        SIMULATION PAUSED
      </span>
      <div className={`${styles.insp} hide`} id="insp" role="dialog" aria-label="Vehicle inspector">
        <h4>
          VEHICLE <span id="iTag">#000</span>
          <button id="inspClose" aria-label="Close inspector">
            ×
          </button>
        </h4>
        <div className={styles.ir}>
          <span>TYPE</span>
          <b id="iType">CAR</b>
        </div>
        <div className={styles.ir}>
          <span>ROUTE</span>
          <b id="iRoute">—</b>
        </div>
        <div className={styles.ir}>
          <span>SPEED</span>
          <b id="iSpd">0 km/h</b>
        </div>
        <div className={styles.ir}>
          <span>WAITED</span>
          <b id="iWait">0.0 s</b>
        </div>
        <div className={styles.ir}>
          <span>PROGRESS</span>
          <b id="iDist">0 m</b>
        </div>
      </div>
      <div className={styles.toast} id="toast" role="status" aria-live="polite" />
    </section>
  );
}
