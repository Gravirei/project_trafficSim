'use client';

import styles from './DeskView.module.css';

export function ControlPanel() {
  return (
    <aside className={styles.panel} role="region" aria-label="Control panel">
      <div className={styles.ph}>
        CONTROL MODE <i data-lucide="sliders-horizontal" />
      </div>
      <div className={styles.blk}>
        <div className={styles.seg3} id="segMode" role="radiogroup" aria-label="Control mode">
          <button data-m="fixed" role="radio" aria-checked="false">
            FIXED
          </button>
          <button data-m="actuated" role="radio" aria-checked="true" className="on">
            ACTUATED
          </button>
          <button data-m="manual" role="radio" aria-checked="false">
            MANUAL
          </button>
        </div>
        <button className={styles.btnPri} id="btnAdvance" aria-label="Advance to next phase">
          <i data-lucide="chevrons-right" /> ADVANCE PHASE
        </button>
        <div className={styles.hint} id="modeHint">
          Actuated: detectors extend green while demand keeps arriving; the phase gap-outs or max-outs on its own.
        </div>
      </div>

      <div className={styles.ph}>
        TIMING PLAN <i data-lucide="timer" />
      </div>
      <div className={styles.blk}>
        <div className={styles.sl}>
          <label htmlFor="s-thru">
            THROUGH GREEN{' '}
            <b>
              <span id="v-thru">14</span>s
            </b>
          </label>
          <input type="range" id="s-thru" min={5} max={40} defaultValue={14} />
        </div>
        <div className={styles.sl}>
          <label htmlFor="s-left">
            LEFT GREEN{' '}
            <b>
              <span id="v-left">7</span>s
            </b>
          </label>
          <input type="range" id="s-left" min={3} max={20} defaultValue={7} />
        </div>
        <div className={styles.sl}>
          <label htmlFor="s-yel">
            YELLOW{' '}
            <b>
              <span id="v-yel">3.0</span>s
            </b>
          </label>
          <input type="range" id="s-yel" min={2} max={5} step={0.5} defaultValue={3} />
        </div>
        <div className={styles.sl}>
          <label htmlFor="s-ar">
            ALL-RED{' '}
            <b>
              <span id="v-ar">2.0</span>s
            </b>
          </label>
          <input type="range" id="s-ar" min={1} max={3} step={0.5} defaultValue={2} />
        </div>
      </div>

      <div className={styles.ph}>
        DEMAND · VEH/MIN <i data-lucide="activity" />
      </div>
      <div className={styles.blk} id="demandBlk" />

      <div className={styles.ph}>
        INCIDENTS <i data-lucide="siren" />
      </div>
      <div className={styles.blk}>
        <div className="pev-grid" id="pevGrid" role="group" aria-label="Preempt approach" />
        <div className={styles.sl} style={{ marginTop: 13 }}>
          <label htmlFor="s-trk">
            TRUCK SHARE{' '}
            <b>
              <span id="v-trk">12</span>%
            </b>
          </label>
          <input type="range" id="s-trk" min={0} max={40} defaultValue={12} />
        </div>
        <button className={styles.btn} id="btnPed" aria-label="Register pedestrian call">
          <i data-lucide="footprints" /> PEDESTRIAN CALL
        </button>
        <div className={styles.hint}>
          Preemption truncates the current phase and launches an emergency vehicle down the chosen approach. Click any
          vehicle on the canvas to inspect it.
        </div>
      </div>
    </aside>
  );
}
