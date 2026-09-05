/**
 * SimSync — bridge the in-browser sim to the backend.
 *
 * Listens for command actions (pause, reset, set-mode, preempt, pedCall,
 * forcePhase) and POSTs them to /api/commands/:id/<kind>. Also pushes
 * a snapshot of the sim to the audit runner every SNAPSHOT_INTERVAL_MS
 * so the backend can detect drift.
 *
 * Phase 6 of the backend integration plan. Phase 7 adds sparkline/event
 * backfill reads; Phase 8 adds the smoke test that uses this in earnest.
 */
import type { ApiClient } from '@/lib/api/client';
import type { SocketClient } from '@/lib/api/socket';
import type { SimState } from './types';
import type { LogEntry } from './types';

const SNAPSHOT_INTERVAL_MS = 5000;

export interface SimSync {
  /** Tear down: stop the snapshot push and remove listeners. */
  destroy(): void;
  /** Manual flush; useful for tests. */
  pushSnapshotNow(): Promise<void>;
  /** Mark a command as fired (debounces the next backend call for the same kind). */
  notifyCommand(kind: string, body?: unknown): Promise<void>;
}

export interface CreateSimSyncOptions {
  api: ApiClient;
  socket?: SocketClient | null;
  /** Override snapshot interval; defaults to 5s. */
  snapshotIntervalMs?: number;
}

/**
 * Wrap a SimState and pipe command actions to the backend. The frontend
 * sim is authoritative for vehicle movement; the backend only sees the
 * command + a periodic snapshot for audit.
 */
export function createSimSync(
  S: SimState,
  opts: CreateSimSyncOptions,
): SimSync {
  const { api, socket = null, snapshotIntervalMs = SNAPSHOT_INTERVAL_MS } = opts;
  const junctionId = S.J.id;
  const recent = new Map<string, number>(); // kind -> last-fired ms

  async function sendCommand(kind: string, body?: unknown): Promise<void> {
    try {
      await api.command(junctionId, kind, body);
    } catch (err) {
      // Backend is best-effort. Surface for debugging but don't block the sim.
      // eslint-disable-next-line no-console
      console.warn('[sync] command failed', kind, err);
    }
  }

  // Throttle per-kind to 1 call per 250ms to avoid hammering the API.
  function shouldFire(kind: string): boolean {
    const now = Date.now();
    const last = recent.get(kind) ?? 0;
    if (now - last < 250) return false;
    recent.set(kind, now);
    return true;
  }

  async function pushSnapshotNow(): Promise<void> {
    if (!S) return;
    const snapshot = {
      junctionId,
      simT: S.simT,
      phase: S.ctl.phase,
      interval: S.ctl.interval,
      resting: S.ctl.resting,
      pedPending: S.ctl.pedPending,
      pedActive: S.ctl.pedActive,
      preempt: S.ctl.preempt
        ? { k: S.ctl.preempt.k, evId: String(S.ctl.preempt.evId) }
        : null,
      queues: S.J.legs.map((_, k) => countQueuedAt(S, k)),
      served: S.stats.served,
      waitAvg: S.stats.waitSum / Math.max(1, S.stats.served),
      waitMax: S.stats.waitMax,
      pushedAt: Date.now(),
    };
    try {
      await api.pushSnapshot(snapshot);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('[sync] snapshot push failed', err);
    }
  }

  const snapshotTimer =
    typeof window !== 'undefined'
      ? window.setInterval(() => {
          void pushSnapshotNow();
        }, snapshotIntervalMs)
      : null;

  // Optional socket wiring: on 'snapshot' from server, log it.
  let offSocket: (() => void) | null = null;
  if (socket) {
    offSocket = socket.on('snapshot', (raw) => {
      // Server-pushed snapshot is informational; the client sim remains
      // authoritative for vehicles. We log only as a breadcrumb.
      // eslint-disable-next-line no-console
      console.debug('[sync] server snapshot', raw);
    });
  }

  return {
    destroy() {
      if (snapshotTimer !== null && typeof window !== 'undefined') {
        window.clearInterval(snapshotTimer);
      }
      offSocket?.();
    },
    pushSnapshotNow,
    async notifyCommand(kind, body) {
      if (!shouldFire(kind)) return;
      await sendCommand(kind, body);
    },
  };
}

/** Per-leg queued-vehicle count for the snapshot. */
function countQueuedAt(S: SimState, leg: number): number {
  let n = 0;
  for (const v of S.vehs) {
    if (v.path.legA === leg && v.s < v.path.stopS) n++;
  }
  return n;
}

/**
 * Best-effort mapping from an in-memory LogEntry to a backend event log row.
 * Not used by createSimSync directly, but kept for Phase 7 (cold reload
 * backfill of the event log).
 */
export function logToBackendShape(entry: LogEntry, junctionId: string): {
  junction_id: string;
  t: number;
  tag: LogEntry['tag'];
  msg: string;
} {
  return {
    junction_id: junctionId,
    t: 0, // The frontend's `t` is a wall-clock fmtClock string; backend stores simT.
    tag: entry.tag,
    msg: entry.msg,
  };
}
