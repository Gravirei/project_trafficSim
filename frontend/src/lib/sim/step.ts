/**
 * Sim step orchestrator.
 * Verbatim port of traffic.html `step()` line 1144-1150.
 */

import { stepController } from './controller';
import { trySpawn, updatePeds, updateVehicles } from './vehicles';
import type { SimState } from './types';

export function step(S: SimState, dt: number): void {
  S.simT += dt;
  const n = S.J.legs.length;
  for (let k = 0; k < n; k++) {
    if (S.vehs.length < 130 && Math.random() < (S.G.demand[k] / 150) * dt) trySpawn(S, k);
  }
  stepController(S, dt);
  updateVehicles(S, dt);
  updatePeds(S, dt);
  // Prune exit history beyond 95s window (matches HTML line 1149)
  while (S.exits.length && S.exits[0] < S.simT - 95) S.exits.shift();
}
