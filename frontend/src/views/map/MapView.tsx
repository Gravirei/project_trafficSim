'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useViewController } from '@/hooks/useViewController';
import { useLucideRefresh } from '@/hooks/useLucide';
import { useMapController, MapJunctionState } from './useMapController';
import { MapJunctionList } from './MapJunctionList';
import styles from './MapView.module.css';

export function MapView() {
  useLucideRefresh();
  const router = useRouter();
  const { showLanding } = useViewController();
  const cvRef = useRef<HTMLCanvasElement | null>(null);
  const [states, setStates] = useState<Record<string, MapJunctionState>>({});

  const ctl = useMapController({
    cvRef,
    onJunctionClick: (id) => router.push('/desk/' + id),
    onStateChange: setStates,
  });

  return (
    <div id="mapview" className={styles.mapview}>
      <header className={styles.topbar}>
        <button
          className={styles.tbBtn}
          onClick={() => showLanding()}
          aria-label="Back to briefing (landing page)"
        >
          <i data-lucide="arrow-left" /> BRIEFING
        </button>
        <span className={styles.tbTitle}>
          GREENWAVE · <b>NETWORK MAP</b> · SIGNALIZED SITES
        </span>
        <span className={styles.modeChip}>
          SITES <b>4 / 4</b> ONLINE
        </span>
        <div className={styles.tbRight}>
          <button className={styles.tbBtn} onClick={ctl.zoomOut} aria-label="Zoom out">
            <i data-lucide="minus" />
          </button>
          <button className={styles.tbBtn} onClick={ctl.zoomIn} aria-label="Zoom in">
            <i data-lucide="plus" />
          </button>
          <button className={styles.tbBtn} onClick={ctl.fit} aria-label="Fit network to viewport">
            <i data-lucide="maximize" /> FIT
          </button>
          <span className={styles.clock} id="mapClock" role="timer" aria-label="Network clock">
            07:00:00
          </span>
        </div>
      </header>
      <div className={styles.mapbody}>
        <aside className={styles.mapside} role="region" aria-label="Junction list">
          <div className={styles.ph}>
            JUNCTIONS <i data-lucide="map-pin" />
          </div>
          <MapJunctionList states={states} onOpen={(id) => router.push('/desk/' + id)} />
          <div className={styles.blk}>
            <div className={styles.hint}>
              CLICK A JUNCTION ON THE MAP OR OPEN ITS DESK FROM THIS LIST. EACH SITE RUNS ITS OWN GEOMETRY AND
              CONTROLLER — STATE IS KEPT WHEN YOU LEAVE AND RETURN.
            </div>
          </div>
        </aside>
        <div className={styles.mapstage}>
          <canvas ref={cvRef} className={styles.mapcv} />
          <div className={styles.maplegend}>
            <div>
              <i style={{ background: 'var(--amber)' }} />
              GW CONTROLLER INSTALLED
            </div>
            <div>
              <i style={{ background: 'var(--grn)' }} />
              LIVE PHASE · CLICK TO OPEN DESK
            </div>
          </div>
          <div className={styles.maphint}>DRAG TO PAN · SCROLL TO ZOOM · CLICK A JUNCTION TO OPEN ITS DESK</div>
        </div>
      </div>
    </div>
  );
}
