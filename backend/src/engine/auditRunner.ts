/**
 * auditRunner — owns one JunctionEngine per junction_def row, ticks
 * them at 1 Hz, accepts client-pushed snapshots, and logs drift to
 * event_log with tag='sys'.
 *
 * Phase 3 of the backend integration plan. The runner is a singleton
 * and is started by server.ts alongside the legacy simulationEngine.
 */
import { JunctionModel } from '../models/junction.model';
import { PhaseDurationModel } from '../models/phaseDuration.model';
import { EventLogModel } from '../models/eventLog.model';
import { logger } from '../config/logger';
import { JunctionEngine, type Command, type EngineSnapshot } from './junctionEngine';

/** Snapshot pushed from the client. Mirrors frontend/src/lib/api/types.ts. */
export interface ClientSnapshot {
  junctionId: string;
  simT: number;
  phase: number;
  interval: 'G' | 'Y' | 'R' | 'WALK';
  queues: number[];
  served: number;
  waitAvg: number;
  waitMax: number;
  pushedAt: number; // wall-clock ms
}

interface DriftEntry {
  field: string;
  client: unknown;
  audit: unknown;
  ts: number;
}

const TICK_INTERVAL_MS = 1000;
const DRIFT_THRESHOLDS = {
  simT: 0.5, // seconds
  queues: 0, // exact match
  served: 0,
  waitAvg: 0.1,
  waitMax: 0.1,
};

class AuditRunner {
  private engines = new Map<string, JunctionEngine>();
  private clientSnaps = new Map<string, ClientSnapshot>();
  private drifts = new Map<string, DriftEntry[]>();
  private interval: NodeJS.Timeout | null = null;
  private running = false;

  /** Load all junctions + durations from the DB and spin up engines. */
  async initialize(): Promise<void> {
    const junctions = await JunctionModel.getAll();
    const durations = await PhaseDurationModel.getAll();
    const durByJunction = new Map(durations.map((d) => [d.junction_id, d]));

    this.engines.clear();
    for (const J of junctions) {
      const engine = new JunctionEngine(J, durByJunction.get(J.id));
      this.engines.set(J.id, engine);
    }
    logger.info({ count: this.engines.size }, '[audit] engines initialized');
  }

  /** Start the 1 Hz tick loop. */
  start(): void {
    if (this.running) return;
    this.running = true;
    this.interval = setInterval(() => {
      void this.tick();
    }, TICK_INTERVAL_MS);
    logger.info('[audit] runner started');
  }

  stop(): void {
    if (!this.running) return;
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    this.running = false;
    logger.info('[audit] runner stopped');
  }

  /** Single tick: step every engine 1s, then compare to any client snapshot. */
  private async tick(): Promise<void> {
    for (const [id, engine] of this.engines) {
      engine.step(1);
      const clientSnap = this.clientSnaps.get(id);
      if (!clientSnap) continue;
      const auditSnap = engine.snapshot();
      this.compareAndLog(id, clientSnap, auditSnap);
    }
  }

  private async compareAndLog(
    junctionId: string,
    client: ClientSnapshot,
    audit: EngineSnapshot,
  ): Promise<void> {
    const drifts: DriftEntry[] = [];

    if (Math.abs(client.simT - audit.simT) > DRIFT_THRESHOLDS.simT) {
      drifts.push({ field: 'simT', client: client.simT, audit: audit.simT, ts: Date.now() });
    }
    if (client.phase !== audit.phase) {
      drifts.push({ field: 'phase', client: client.phase, audit: audit.phase, ts: Date.now() });
    }
    if (client.interval !== audit.interval) {
      drifts.push({
        field: 'interval',
        client: client.interval,
        audit: audit.interval,
        ts: Date.now(),
      });
    }
    if (client.served !== audit.served) {
      drifts.push({
        field: 'served',
        client: client.served,
        audit: audit.served,
        ts: Date.now(),
      });
    }
    if (Math.abs(client.waitAvg - audit.waitAvg) > DRIFT_THRESHOLDS.waitAvg) {
      drifts.push({
        field: 'waitAvg',
        client: client.waitAvg,
        audit: audit.waitAvg,
        ts: Date.now(),
      });
    }

    if (drifts.length === 0) return;

    const existing = this.drifts.get(junctionId) ?? [];
    existing.push(...drifts);
    // Cap in-memory drift log so a runaway client doesn't OOM us.
    while (existing.length > 200) existing.shift();
    this.drifts.set(junctionId, existing);

    // Persist the first drift per tick to event_log. Subsequent drifts
    // in the same tick are aggregated to one row.
    const summary = drifts
      .map((d) => `${d.field}: client=${JSON.stringify(d.client)} audit=${JSON.stringify(d.audit)}`)
      .join('; ');
    try {
      await EventLogModel.append(junctionId, audit.simT, 'sys', `DRIFT — ${summary}`);
    } catch (err) {
      logger.error({ err, junctionId }, '[audit] failed to persist drift');
    }
  }

  // ─── Public API used by REST routes (Phase 4) ─────────────────────

  /** Receive a client snapshot for a junction. Replaces the prior one. */
  pushClientSnapshot(snap: ClientSnapshot): void {
    this.clientSnaps.set(snap.junctionId, snap);
  }

  /** Apply a command to a junction's engine. */
  applyCommand(junctionId: string, cmd: Command): { ok: true } | { ok: false; reason: string } {
    const engine = this.engines.get(junctionId);
    if (!engine) return { ok: false, reason: `unknown junction: ${junctionId}` };
    return engine.applyCommand(cmd);
  }

  /** Update durations for a junction (e.g. slider change). */
  setDurations(
    junctionId: string,
    patch: Partial<{ thru: number; left: number; yellow: number; allred: number }>,
  ): boolean {
    const engine = this.engines.get(junctionId);
    if (!engine) return false;
    engine.setDurations(patch);
    return true;
  }

  /** Read-only access to the engine map (used by telemetry routes). */
  getEngines(): Map<string, JunctionEngine> {
    return this.engines;
  }

  /** Return recent drift entries for a junction. */
  getDrifts(junctionId: string): DriftEntry[] {
    return this.drifts.get(junctionId) ?? [];
  }
}

export const auditRunner = new AuditRunner();
