'use client';

import { RefObject } from 'react';
import { RadioTower, Layers, BarChart3, Terminal } from 'lucide-react';
import styles from './DeskView.module.css';

export function TelemetryPanel({ sparkRef }: { sparkRef: RefObject<HTMLCanvasElement | null> }) {
  return (
    <aside className={styles.panel} role="region" aria-label="Telemetry panel">
      <div className={styles.ph}>
        SIGNAL RING <RadioTower size={14} strokeWidth={2} />
      </div>
      <div className={styles.blk}>
        <div className={styles.strip} id="strip" role="tablist" aria-label="Phase ring" />
        <div className={styles.bigphase} id="phName">
          —
        </div>
        <div className={styles.meta}>
          INTERVAL <b id="phInt">—</b> · REMAINING <b id="phRem">—</b>
          <br />
          NEXT <b id="phNext">—</b>
          <br />
          SERVING <b id="phServe">—</b>
        </div>
      </div>

      <div className={styles.ph}>
        QUEUE DEPTH <Layers size={14} strokeWidth={2} />
      </div>
      <div className={styles.blk} id="queues" />

      <div className={styles.ph}>
        MEASURES <BarChart3 size={14} strokeWidth={2} />
      </div>
      <div className={styles.blk}>
        <div className={styles.statsGrid}>
          <div className={styles.sg}>
            <div className={styles.k}>SERVED</div>
            <div className={styles.v} id="stServed">
              0
            </div>
          </div>
          <div className={styles.sg}>
            <div className={styles.k}>FLOW</div>
            <div className={styles.v} id="stFlow">
              0<b>/min</b>
            </div>
          </div>
          <div className={styles.sg}>
            <div className={styles.k}>AVG WAIT</div>
            <div className={styles.v} id="stAvg">
              0.0<b>s</b>
            </div>
          </div>
          <div className={styles.sg}>
            <div className={styles.k}>WORST WAIT</div>
            <div className={styles.v} id="stMax">
              0.0<b>s</b>
            </div>
          </div>
        </div>
        <canvas
          ref={sparkRef}
          id="spark"
          width={272}
          height={46}
          className={styles.spark}
          aria-label="Throughput sparkline"
        />
        <div className={styles.sparkCap}>THROUGHPUT · VEH PER 3s · LAST 90s</div>
      </div>

      <div className={styles.ph}>
        EVENT LOG <Terminal size={14} strokeWidth={2} />
      </div>
      <div className={styles.blk}>
        <div className={styles.log} id="log" role="log" aria-live="polite" />
      </div>
    </aside>
  );
}
