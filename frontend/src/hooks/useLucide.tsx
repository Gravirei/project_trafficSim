'use client';

import { useEffect, useLayoutEffect } from 'react';

declare global {
  interface Window {
    lucide?: { createIcons: () => void };
  }
}

/**
 * Refresh Lucide icon SVGs after React commits new tree content.
 *
 * The Lucide UMD script loads via `<script defer>` and races with React
 * hydration. So we:
 *  1. Try to create icons on every layout effect (cheap, idempotent).
 *  2. Poll for `window.lucide` and create icons as soon as the script
 *     finishes loading (covers the race).
 *  3. Listen to `DOMContentLoaded` as a final fallback.
 */
export function useLucideRefresh() {
  // useLayoutEffect: render before paint so icons are never seen as
  // empty <i> boxes for a frame. Falls back to useEffect during SSR.
  const useIsoLayout = typeof window !== 'undefined' ? useLayoutEffect : useEffect;
  useIsoLayout(() => {
    if (typeof window === 'undefined') return;
    window.lucide?.createIcons();
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    // Already loaded — nothing to do.
    if (window.lucide) {
      window.lucide.createIcons();
      return;
    }
    // Wait for the async UMD bundle to finish loading.
    let cancelled = false;
    let tries = 0;
    const tick = () => {
      if (cancelled) return;
      if (window.lucide) {
        window.lucide.createIcons();
        return;
      }
      if (++tries > 100) return; // ~5s, then give up
      setTimeout(tick, 50);
    };
    tick();
    const onReady = () => window.lucide?.createIcons();
    document.addEventListener('DOMContentLoaded', onReady);
    return () => {
      cancelled = true;
      document.removeEventListener('DOMContentLoaded', onReady);
    };
  }, []);
}
