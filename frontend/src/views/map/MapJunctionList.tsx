'use client';

import { useEffect, useRef } from 'react';
import { JUNCTION_IDS, JUNCS } from '@/lib/sim';
import { MapJunctionState } from './useMapController';
import styles from './MapView.module.css';

const ivColor = (iv: string) => (iv === 'G' ? '#4fc47a' : iv === 'Y' ? '#f2b13c' : '#e5484d');

export function MapJunctionList({
  states,
  onOpen,
}: {
  states: Record<string, MapJunctionState>;
  onOpen: (id: string) => void;
}) {
  const rowsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!rowsRef.current) return;
    // Sync the colour dot of every row.
    for (const id of JUNCTION_IDS) {
      const dot = rowsRef.current.querySelector(`[data-i="${id}"]`) as HTMLElement | null;
      if (dot) dot.style.background = ivColor(states[id]?.interval ?? 'G');
    }
  }, [states]);

  return (
    <div ref={rowsRef}>
      {JUNCTION_IDS.map((id) => {
        const J = JUNCS[id];
        return (
          <div
            key={id}
            className={styles.mrow}
            role="button"
            tabIndex={0}
            onClick={() => onOpen(id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onOpen(id);
              }
            }}
            aria-label={`Open ${J.name} control desk`}
          >
            <span className={styles.mcode}>{J.code}</span>
            <div className={styles.mtxt}>
              <b>{J.name}</b>
              <span>{J.shape}</span>
            </div>
            <span className={styles.mdot} data-i={id} />
            <button
              className={styles.mopen}
              onClick={(e) => {
                e.stopPropagation();
                onOpen(id);
              }}
              aria-label={`Open ${J.name} desk`}
            >
              OPEN
            </button>
          </div>
        );
      })}
    </div>
  );
}
