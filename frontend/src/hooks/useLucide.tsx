'use client';

import { useEffect } from 'react';

declare global {
  interface Window {
    lucide?: { createIcons: () => void };
  }
}

/**
 * Refresh Lucide icon SVGs after React commits new tree content.
 * Cheap to call on every render — Lucide's createIcons is idempotent.
 */
export function useLucideRefresh() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.lucide?.createIcons();
  });
}
