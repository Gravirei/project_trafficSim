/**
 * JunctionEngine — per-junction audit-mode simulator.
 *
 * Mirrors the frontend FSM semantics from
 * frontend/src/lib/sim/controller.ts:stepController() so any drift
 * between the client sim and the audit engine is meaningful.
 *
 * This is NOT a vehicle simulator. It tracks phase / interval / preempts
 * / pedestrian state, applies user commands, and produces snapshots
 * that the auditRunner compares against client-pushed snapshots.
 *
 * Tick rate: 1 Hz (slower than the client, on purpose — the audit
 * engine is a sanity check, not a driver).
 */
import type { JunctionDef, JunctionPhase } from '../models/junction.model';
import type { PhaseDurations } from '../models/phaseDuration.model';
import { EventLogModel } from '../models/eventLog.model';

export type Interval = 'G' | 'Y' | 'R' | 'WALK';
export type Mode = 'fixed' | 'actuated' | 'manual';

export interface PreemptState {
  k: number; // leg being preempted
  evId: string;
}

export interface EngineSnapshot {
  junctionId: string;
  simT: number;
  phase: number;
  interval: Interval;
  resting: boolean;
  pedPending: boolean;
  pedActive: boolean;
  preempt: PreemptState | null;
  // Lightweight metrics — populated by auditRunner from a separate model.
  // Kept here so snapshots stay self-contained.
  queues: number[];
  served: number;
  waitAvg: number;
  waitMax: number;
}

export type Command =
  | { kind: 'reset' }
  | { kind: 'setMode'; mode: Mode }
  | { kind: 'preempt'; leg: number }
  | { kind: 'pedCall'; side: number }
  | { kind: 'forcePhase'; phase: number };

/** Pick the planned duration (in seconds) for a given phase. */
function planDur(durations: PhaseDurations, phase: JunctionPhase): number {
  return phase.dur === 'thru' ? durations.thru : durations.left;
}

const DEFAULT_DURATIONS: PhaseDurations = {
  junction_id: '',
  thru: 12,
  left: 8,
  yellow: 3,
  allred: 1,
  truck_share: 0.1,
  updated_at: new Date(0),
};

export class JunctionEngine {
  readonly junctionId: string;
  private J: JunctionDef;
  private durations: PhaseDurations;

  // FSM state — mirrors SimState.ctl from the frontend.
  private _simT = 0;
  private _phase = 0;
  private _interval: Interval = 'G';
  private _phaseT = 0;
  private _resting = false;
  private _pedPending = false;
  private _pedActive = false;
  private _pedSide = 0;
  private _pedDur = 8;
  private _mode: Mode = 'fixed';
  private _preempt: PreemptState | null = null;

  // Audit metrics. Real values come from a queue model; here we keep
  // trivial counters so snapshot() always has a stable shape.
  private _queues: number[] = [];
  private _served = 0;
  private _waitSum = 0;
  private _waitCount = 0;
  private _waitMax = 0;

  constructor(J: JunctionDef, durations?: PhaseDurations) {
    this.junctionId = J.id;
    this.J = J;
    this.durations = durations ?? { ...DEFAULT_DURATIONS, junction_id: J.id };
    this._queues = new Array(J.leg_angles.length).fill(0);
  }

  // ─── Public read API ─────────────────────────────────────────────
  get simT(): number {
    return this._simT;
  }
  get phase(): number {
    return this._phase;
  }
  get interval(): Interval {
    return this._interval;
  }
  get mode(): Mode {
    return this._mode;
  }
  get preempt(): PreemptState | null {
    return this._preempt;
  }

  /** JSON-friendly snapshot. */
  snapshot(): EngineSnapshot {
    const waitAvg = this._waitCount > 0 ? this._waitSum / this._waitCount : 0;
    return {
      junctionId: this.junctionId,
      simT: round2(this._simT),
      phase: this._phase,
      interval: this._interval,
      resting: this._resting,
      pedPending: this._pedPending,
      pedActive: this._pedActive,
      preempt: this._preempt,
      queues: this._queues.slice(),
      served: this._served,
      waitAvg: round2(waitAvg),
      waitMax: round2(this._waitMax),
    };
  }

  /** Update durations live (e.g. when a slider is moved). */
  setDurations(patch: Partial<PhaseDurations>): void {
    this.durations = { ...this.durations, ...patch };
  }

  // ─── Commands ────────────────────────────────────────────────────
  applyCommand(cmd: Command): { ok: true } | { ok: false; reason: string } {
    switch (cmd.kind) {
      case 'reset':
        this.reset();
        return { ok: true };
      case 'setMode':
        this._mode = cmd.mode;
        this._resting = false;
        return { ok: true };
      case 'preempt':
        return this.applyPreempt(cmd.leg);
      case 'pedCall':
        this._pedPending = true;
        this._pedSide = cmd.side;
        return { ok: true };
      case 'forcePhase':
        if (cmd.phase < 0 || cmd.phase >= this.J.phases.length) {
          return { ok: false, reason: 'phase out of range' };
        }
        this._phase = cmd.phase;
        this._interval = 'G';
        this._phaseT = 0;
        this._resting = false;
        this._pedActive = false;
        return { ok: true };
    }
  }

  private applyPreempt(leg: number): { ok: true } | { ok: false; reason: string } {
    if (this._preempt) return { ok: false, reason: 'preempt already active' };
    if (leg < 0 || leg >= this.J.leg_angles.length) {
      return { ok: false, reason: 'leg out of range' };
    }
    this._preempt = { k: leg, evId: `audit-ev-${this._simT}` };
    void EventLogModel.append(
      this.junctionId,
      this._simT,
      'ev',
      `PREEMPTION — ${this.J.leg_full[leg] ?? `LEG ${leg}`}`,
    );
    // If the current phase already serves this leg, leave G running; else
    // terminate the current green so the next phase picks up the leg.
    const serves = this.currentPhaseMoves().some(
      (m) => m[0] === leg && (m[1] === 'L' || m[1] === 'T' || m[1] === '*'),
    );
    if (this._interval === 'G' && !serves) this.termGreen();
    else if (this._interval === 'WALK') this.nextPhase();
    return { ok: true };
  }

  private reset(): void {
    this._simT = 0;
    this._phase = 0;
    this._interval = 'G';
    this._phaseT = 0;
    this._resting = false;
    this._pedPending = false;
    this._pedActive = false;
    this._preempt = null;
    this._queues = new Array(this.J.leg_angles.length).fill(0);
    this._served = 0;
    this._waitSum = 0;
    this._waitCount = 0;
    this._waitMax = 0;
  }

  // ─── Tick ────────────────────────────────────────────────────────
  /**
   * Advance the audit engine by `dt` seconds. The engine runs at 1 Hz by
   * convention but is fully dt-driven so the auditRunner can replay
   * client time without changing behavior.
   */
  step(dt: number): void {
    if (dt <= 0) return;
    // We tick the FSM in fixed 1s increments so behavior matches a 1Hz
    // audit loop. Sub-second dt is acceptable; we round to the nearest
    // whole second for transition checks.
    const secs = Math.max(1, Math.round(dt));
    for (let i = 0; i < secs; i++) {
      this._simT += 1;
      this._phaseT += 1;
      this.stepFSM();
    }
  }

  private stepFSM(): void {
    const plan = planDur(this.durations, this.J.phases[this._phase]);

    if (this._interval === 'G') {
      // Preempt: clear when EV has cleared the box.
      if (this._preempt) {
        // We don't model the EV vehicle, so audits clear preempts after
        // a synthetic "clear time" equal to the phase plan + yellow.
        if (this._phaseT >= plan + this.durations.yellow) {
          this._preempt = null;
          this.termGreen();
          return;
        }
      } else if (this._mode === 'manual') {
        // hold
      } else if (this._mode === 'fixed') {
        if (this._phaseT >= plan) this.termGreen();
      } else {
        // actuated
        const minG = Math.min(5, plan);
        if (this._phaseT >= minG) {
          if (this._resting) {
            // The audit engine does not model demand directly; we treat
            // resting phases as "no demand yet, hold for full plan"
            // which is the conservative behavior. Drift here is exactly
            // what the audit will surface.
            if (this._phaseT >= plan) this.termGreen();
          } else {
            if (this._phaseT >= plan) this.termGreen();
          }
        }
      }
    } else if (this._interval === 'Y') {
      if (this._phaseT >= this.durations.yellow) {
        this._interval = 'R';
        this._phaseT = 0;
      }
    } else if (this._interval === 'R') {
      if (this._phaseT >= this.durations.allred) {
        if (this._pedPending && !this._preempt) this.startWalk();
        else this.nextPhase();
      }
    } else if (this._interval === 'WALK') {
      if (this._phaseT >= this._pedDur) this.nextPhase();
    }
  }

  private termGreen(): void {
    this._interval = 'Y';
    this._phaseT = 0;
  }

  private nextPhase(): void {
    this._pedActive = false;
    let p: number;
    if (this._preempt) {
      p = this.J.phases.findIndex((ph) =>
        ph.moves.some(
          (m) => m[0] === this._preempt!.k && (m[1] === 'L' || m[1] === 'T' || m[1] === '*'),
        ),
      );
      if (p < 0) {
        p = this.J.phases.findIndex((ph) =>
          ph.moves.some((m) => m[0] === this._preempt!.k),
        );
      }
      if (p < 0) p = 0;
    } else {
      p = (this._phase + 1) % this.J.phases.length;
    }
    this._phase = p;
    this._interval = 'G';
    this._phaseT = 0;
    this._resting = false;
    void EventLogModel.append(
      this.junctionId,
      this._simT,
      'phase',
      `PHASE ${p + 1} — ${this.J.phases[p].name} · GREEN`,
    );
  }

  private startWalk(): void {
    this._interval = 'WALK';
    this._phaseT = 0;
    this._pedActive = true;
    this._pedPending = false;
    void EventLogModel.append(
      this.junctionId,
      this._simT,
      'ped',
      `WALK — ${this.J.leg_names[this._pedSide] ?? `SIDE ${this._pedSide}`}`,
    );
  }

  private currentPhaseMoves(): JunctionPhase['moves'] {
    return this.J.phases[this._phase]?.moves ?? [];
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
