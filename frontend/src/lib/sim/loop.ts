/**
 * Main rAF loop dispatcher.
 * Verbatim port of traffic.html lines 1700-1713.
 */

export interface FrameHandlers {
  /** Called every rAF regardless of view. */
  tickAll?: (dt: number, now: number) => void;
  /** Called when the active view is 'landing'. */
  landing?: (dt: number, now: number) => void;
  /** Called when the active view is 'map'. */
  map?: (dt: number, now: number) => void;
  /** Called when the active view is 'control'. */
  control?: (dt: number, now: number) => void;
  /** Returns the current view at each frame. */
  getView: () => 'landing' | 'map' | 'control';
}

export function startMainLoop(handlers: FrameHandlers): () => void {
  let lastT = performance.now();
  let cancelled = false;
  let rafId = 0;

  const loop = (now: number) => {
    if (cancelled) return;
    const dt = Math.min(0.05, (now - lastT) / 1000);
    lastT = now;
    try {
      handlers.tickAll?.(dt, now);
      const v = handlers.getView();
      if (v === 'landing') handlers.landing?.(dt, now);
      else if (v === 'map') handlers.map?.(dt, now);
      else if (v === 'control') handlers.control?.(dt, now);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[GREENWAVE] frame error:', err);
    }
    rafId = requestAnimationFrame(loop);
  };
  rafId = requestAnimationFrame(loop);

  return () => {
    cancelled = true;
    cancelAnimationFrame(rafId);
  };
}
