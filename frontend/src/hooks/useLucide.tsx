'use client';

import { useEffect } from 'react';

declare global {
  interface Window {
    lucide?: { createIcons: () => void };
  }
}

/**
 * Refresh Lucide icon SVGs after the browser has painted.
 *
 * setTimeout(0) defers to the next event-loop tick, ensuring React's
 * effects have fully committed before Lucide touches the DOM.
 */
export function useLucideRefresh() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (!window.lucide) {
      const id = setInterval(() => {
        if (window.lucide) {
          clearInterval(id);
          setTimeout(() => window.lucide!.createIcons(), 500);
        }
      }, 50);
      return () => clearInterval(id);
    }

    setTimeout(() => window.lucide!.createIcons(), 500);
  }, []);
}
