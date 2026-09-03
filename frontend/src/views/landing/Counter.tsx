'use client';

import { useEffect, useRef } from 'react';

/**
 * Animated counter that counts up to `target` when scrolled into view.
 * Wraps each Stat number from the original landing page.
 */
export function Counter({ target }: { target: number }) {
  const ref = useRef<HTMLSpanElement | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          observer.unobserve(e.target);
          const t0 = performance.now();
          const anim = (now: number) => {
            const p = Math.min(1, (now - t0) / 1300);
            const v = Math.round(target * (1 - Math.pow(1 - p, 3)));
            el.textContent = v.toLocaleString();
            if (p < 1) requestAnimationFrame(anim);
          };
          requestAnimationFrame(anim);
        }
      },
      { threshold: 0.6 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [target]);
  return (
    <span ref={ref} data-n={target}>
      0
    </span>
  );
}
