import '@testing-library/jest-dom/vitest';
import 'whatwg-fetch';

// Tell React we're in a test environment so `act()` warns/errors are silenced.
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

// Node 26+ ships a built-in `localStorage` on globalThis that returns
// `undefined` (the `ExperimentalWarning: --localstorage-file not provided`
// warning) and shadows jsdom's window.localStorage. We override the
// descriptor on globalThis with a working in-memory stub. Tests that need
// per-spec isolation should call `localStorage.clear()` in beforeEach.
const inMemoryStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (k: string) => (k in store ? store[k] : null),
    setItem: (k: string, v: string) => {
      store[k] = String(v);
    },
    removeItem: (k: string) => {
      delete store[k];
    },
    clear: () => {
      store = {};
    },
    key: (i: number) => Object.keys(store)[i] ?? null,
    get length() {
      return Object.keys(store).length;
    },
  };
})();

Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  enumerable: true,
  get: () => inMemoryStorage,
  set: () => {
    /* no-op: tests cannot replace the storage object */
  },
});
Object.defineProperty(globalThis, 'sessionStorage', {
  configurable: true,
  enumerable: true,
  get: () => inMemoryStorage,
  set: () => {},
});
