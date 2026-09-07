/**
 * View manager + hash router.
 * Verbatim port of traffic.html lines 612-633.
 *
 * Tracks:
 *  - current view: 'landing' | 'map' | 'control'
 *  - current junction id (when view === 'control')
 *  - hashLock so we don't double-fire on hashchange
 */

import { JUNCTION_IDS } from './constants';

export type View = 'landing' | 'map' | 'control' | 'dashboard';

export interface ViewManager {
  getView(): View;
  getJunction(): string | null;
  setView(v: View): void;
  showLanding(): void;
  showMap(): void;
  showDashboard(): void;
  enterJunction(id: string): void;
  /** Wire up the Next.js router so view changes actually change the route. */
  setNavigator(nav: { push: (path: string) => void }): void;
  routeHash(): void;
  onViewChange(cb: (v: View) => void): () => void;
  onJunctionChange(cb: (id: string) => void): () => void;
  destroy(): void;
}

export function createViewManager(): ViewManager {
  let view: View = (document.body.dataset.view as View) || 'landing';
  let currentJunc: string | null = null;
  let hashLock = false;
  let nav: { push: (path: string) => void } | null = null;
  const viewCbs: Array<(v: View) => void> = [];
  const juncCbs: Array<(id: string) => void> = [];

  const onHashChange = () => {
    if (hashLock) {
      hashLock = false;
      return;
    }
    routeHash();
  };
  window.addEventListener('hashchange', onHashChange);

  function emitView(v: View) {
    view = v;
    document.body.dataset.view = v;
    viewCbs.forEach((cb) => cb(v));
  }

  function emitJunction(id: string) {
    currentJunc = id;
    juncCbs.forEach((cb) => cb(id));
  }

  function replaceHash(h: string) {
    if (location.hash !== h) {
      hashLock = true;
      location.hash = h;
    }
  }

  function routeHash(): void {
    const h = location.hash;
    if (h.startsWith('#desk-')) {
      const id = h.slice(6);
      if (JUNCTION_IDS.includes(id) && id !== currentJunc) {
        currentJunc = id;
        emitView('control');
        emitJunction(id);
        nav?.push('/desk/' + id);
      }
    } else if (h === '#dashboard') {
      if (view !== 'dashboard') {
        emitView('dashboard');
        nav?.push('/dashboard');
      }
    } else if (h === '#map') {
      if (view !== 'map') {
        emitView('map');
        nav?.push('/map');
      }
    } else if (view !== 'landing') {
      emitView('landing');
      nav?.push('/');
    }
  }

  return {
    getView: () => view,
    getJunction: () => currentJunc,
    setView: (v) => {
      emitView(v);
      if (v === 'landing') {
        replaceHash('');
        nav?.push('/');
      }
      if (v === 'map') {
        replaceHash('#map');
        nav?.push('/map');
      }
      if (v === 'dashboard') {
        replaceHash('#dashboard');
        nav?.push('/dashboard');
      }
    },
    showLanding: () => {
      emitView('landing');
      replaceHash('');
      nav?.push('/');
    },
    showMap: () => {
      emitView('map');
      replaceHash('#map');
      nav?.push('/map');
    },
    showDashboard: () => {
      emitView('dashboard');
      replaceHash('#dashboard');
      nav?.push('/dashboard');
    },
    enterJunction: (id) => {
      if (!JUNCTION_IDS.includes(id)) return;
      currentJunc = id;
      emitJunction(id);
      emitView('control');
      replaceHash('#desk-' + id);
      nav?.push('/desk/' + id);
    },
    setNavigator: (n) => {
      nav = n;
    },
    routeHash,
    onViewChange: (cb) => {
      viewCbs.push(cb);
      return () => {
        const i = viewCbs.indexOf(cb);
        if (i >= 0) viewCbs.splice(i, 1);
      };
    },
    onJunctionChange: (cb) => {
      juncCbs.push(cb);
      return () => {
        const i = juncCbs.indexOf(cb);
        if (i >= 0) juncCbs.splice(i, 1);
      };
    },
    destroy: () => {
      window.removeEventListener('hashchange', onHashChange);
    },
  };
}
