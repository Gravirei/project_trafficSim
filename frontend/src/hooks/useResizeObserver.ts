'use client';

import { useEffect, useRef } from 'react';

export function useResizeObserver<T extends HTMLElement>(
  cb: (entry: ResizeObserverEntry) => void,
): React.MutableRefObject<T | null> {
  const ref = useRef<T | null>(null);
  const cbRef = useRef(cb);
  cbRef.current = cb;

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const obs = new ResizeObserver((entries) => {
      for (const entry of entries) cbRef.current(entry);
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return ref;
}
