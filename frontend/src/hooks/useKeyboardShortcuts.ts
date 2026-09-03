'use client';

import { useEffect } from 'react';

export interface ShortcutHandlers {
  onSpace?: () => void;
  onDigit?: (digit: number) => void;
}

/**
 * Global keyboard listener. Only triggers when the active element is
 * not an input/textarea/select so users can type freely.
 */
export function useKeyboardShortcuts(handlers: ShortcutHandlers, enabled: boolean = true) {
  useEffect(() => {
    if (!enabled) return;
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.code === 'Space') {
        e.preventDefault();
        handlers.onSpace?.();
      } else if (e.key >= '1' && e.key <= '9') {
        handlers.onDigit?.(Number(e.key));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handlers, enabled]);
}
