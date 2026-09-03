/**
 * SimulationProvider — abstraction between the UI and the sim backend.
 * Today the only implementation is the local client-side sim.
 * A future SocketProvider can drop in without changing any React code.
 */

import type { SimState } from './types';
import type { Mode, Vehicle } from './types';

export interface ControllerRefs {
  // Stable DOM identifiers used by useDeskController; sim layer is DOM-free.
  [key: string]: unknown;
}

export interface SimulationProvider {
  getState(id: string): SimState | null;
  /** Mount per-junction DOM bindings (sliders, buttons, canvas, etc.). */
  mount(id: string, refs: ControllerRefs): void;
  /** Advance one fixed substep. */
  step(id: string, dt: number): void;
  /** Called every rAF; consumers also draw the static+dynamic layers. */
  frame(id: string, dtReal: number, now: number): void;
  /** Keyboard delegation from RootShell. */
  key(id: string, e: KeyboardEvent): void;

  select(id: string, v: Vehicle | null): void;
  pause(id: string): void;
  reset(id: string): void;
  setMode(id: string, mode: Mode): void;
  setSpeed(id: string, speed: number): void;
  setTiming(id: string, key: 'thru' | 'left' | 'yellow' | 'allred' | 'truck', value: number): void;
  setDemand(id: string, leg: number, value: number): void;
  preempt(id: string, leg: number): void;
  pedCall(id: string): void;
  toggleNight(id: string): void;
}
