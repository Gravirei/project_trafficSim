import { SignalFSM } from './signalFSM';
import { QueueModel, QueueMetrics } from './queueModel';
import { SignalModel } from '../models/signal.model';
import { QueueHistoryModel } from '../models/queueHistory.model';
import { VehicleLogModel } from '../models/vehicleLog.model';

export type SimulationMode = 'MANUAL' | 'ADAPTIVE';

export interface SignalTickData {
    signalId: number;
    name: string;
    state: 'GREEN' | 'YELLOW' | 'RED';
    timeRemaining: number;
    queueLength: number;
    theoreticalLq: number;
    avgWaitTime: number;
    utilization: number;
    arrivalRate: number;
}

export interface TickData {
    tick: number;
    signals: SignalTickData[];
    mode: SimulationMode;
    adaptiveAction?: string | null;
}

interface SignalUnit {
    fsm: SignalFSM;
    queue: QueueModel;
}

/**
 * Phase controller for a 4-way intersection.
 * 
 * Instead of 4 independent FSMs (which drift apart under adaptive extensions),
 * we use a centralized phase machine:
 * 
 *   Phase A_GREEN:  N/S = GREEN,  E/W = RED
 *   Phase A_YELLOW: N/S = YELLOW, E/W = RED
 *   Phase B_GREEN:  E/W = GREEN,  N/S = RED
 *   Phase B_YELLOW: E/W = YELLOW, N/S = RED
 *   → repeat
 * 
 * Adaptive mode extends the GREEN phase of whichever group has heavier traffic,
 * while the opposing group's RED is automatically extended by the same amount.
 * This guarantees mutual exclusion — opposing groups can NEVER be green simultaneously.
 */
type Phase = 'A_GREEN' | 'A_YELLOW' | 'B_GREEN' | 'B_YELLOW';

export class SimulationEngine {
    private signals: Map<number, SignalUnit> = new Map();
    private running: boolean = false;
    private currentTick: number = 0;
    private intervalId: NodeJS.Timeout | null = null;
    private tickInterval: number = 1000; // ms
    private mode: SimulationMode = 'MANUAL';
    private adaptiveThreshold: number = 10; // Queue length threshold
    private speedMultiplier: number = 1;
    private arrivalRate: number = 0.5;
    private onTick: ((data: TickData) => void) | null = null;

    // ─── Phase controller state ─────────────────────────────────────────
    private phase: Phase = 'A_GREEN';
    private phaseTimer: number = 30;   // Countdown for current phase

    // Base durations (loaded from DB, assumed same for all signals)
    private greenDuration: number = 30;
    private yellowDuration: number = 5;
    // redDuration is implicit: it equals the opposing group's green + yellow

    private adaptiveExtension: number = 0;
    private maxAdaptiveExtension: number = 15;
    private lastAdaptiveAction: string | null = null;

    // Signal groups — populated during initialize()
    // Group A = N/S (signal indices 0,1), Group B = E/W (signal indices 2,3)
    private groupA: number[] = []; // signal IDs in group A
    private groupB: number[] = []; // signal IDs in group B

    /**
     * Initialize the engine by loading signals from the database
     */
    async initialize(): Promise<void> {
        const dbSignals = await SignalModel.getAll();

        this.signals.clear();
        this.groupA = [];
        this.groupB = [];

        for (let i = 0; i < dbSignals.length; i++) {
            const signal = dbSignals[i];
            const fsm = new SignalFSM(
                signal.id,
                signal.name,
                signal.green_duration,
                signal.red_duration,
                signal.yellow_duration
            );

            const queue = new QueueModel(0.5, 1.2);
            this.signals.set(signal.id, { fsm, queue });

            // Assign to groups: first 2 = Group A (North/South), next 2 = Group B (East/West)
            if (i < 2) {
                this.groupA.push(signal.id);
            } else {
                this.groupB.push(signal.id);
            }
        }

        // Use durations from first signal as base (all signals share same timing)
        if (dbSignals.length > 0) {
            this.greenDuration = dbSignals[0].green_duration;
            this.yellowDuration = dbSignals[0].yellow_duration;
        }

        // Start in A_GREEN: N/S green, E/W red
        this.phase = 'A_GREEN';
        this.phaseTimer = this.greenDuration;
        this.adaptiveExtension = 0;

        // Set initial FSM states so the FSM objects reflect the phase
        this.syncFSMsToPhase();

        console.log(`🚦 Simulation engine initialized with ${this.signals.size} signals (Group A: [${this.groupA}], Group B: [${this.groupB}])`);
    }

    /**
     * Sync individual FSM states to match the current phase.
     * The FSMs are now "slave" objects — the phase controller is the master.
     */
    private syncFSMsToPhase(): void {
        const [greenGroup, redGroup, greenState, _] = this.getPhaseGroups();

        for (const id of greenGroup) {
            const unit = this.signals.get(id);
            if (unit) unit.fsm.forceState(greenState, this.phaseTimer);
        }
        for (const id of redGroup) {
            const unit = this.signals.get(id);
            // Red group's remaining time = current phase timer + remaining yellow
            // (they stay red through the active group's green + yellow)
            if (unit) {
                const redTime = greenState === 'GREEN'
                    ? this.phaseTimer + this.yellowDuration
                    : this.phaseTimer; // We're in yellow, they stay red for just the yellow timer
                unit.fsm.forceState('RED', redTime);
            }
        }
    }

    /**
     * Returns [activeGroup, inactiveGroup, activeState, phaseName]
     */
    private getPhaseGroups(): [number[], number[], 'GREEN' | 'YELLOW', string] {
        switch (this.phase) {
            case 'A_GREEN':  return [this.groupA, this.groupB, 'GREEN',  'A'];
            case 'A_YELLOW': return [this.groupA, this.groupB, 'YELLOW', 'A'];
            case 'B_GREEN':  return [this.groupB, this.groupA, 'GREEN',  'B'];
            case 'B_YELLOW': return [this.groupB, this.groupA, 'YELLOW', 'B'];
        }
    }

    /**
     * Set callback for tick events (used by WebSocket)
     */
    setOnTick(callback: (data: TickData) => void): void {
        this.onTick = callback;
    }

    /**
     * Start the simulation loop
     */
    start(): void {
        if (this.running) return;

        this.running = true;
        this.intervalId = setInterval(() => {
            this.tick();
        }, this.tickInterval);

        console.log('▶️  Simulation started');
    }

    /**
     * Stop the simulation loop
     */
    stop(): void {
        if (!this.running) return;

        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        this.running = false;

        console.log('⏹️  Simulation stopped');
    }

    /**
     * Reset the simulation
     */
    async reset(): Promise<void> {
        this.stop();
        this.currentTick = 0;

        // Reset all FSMs and queues
        for (const [, unit] of this.signals) {
            unit.fsm.reset();
            unit.queue.reset();
        }

        // Clear DB logs
        await QueueHistoryModel.clear();
        await VehicleLogModel.clear();

        // Reload signals from DB
        await this.initialize();

        console.log('↺  Simulation reset');
    }

    /**
     * Execute one simulation tick with centralized phase control
     */
    private async tick(): Promise<void> {
        this.currentTick++;

        // ─── 1. Phase countdown & transition ─────────────────────────────
        this.phaseTimer--;

        this.lastAdaptiveAction = null; // Clear at start of each tick

        // Adaptive mode: compare queues and extend or terminate
        if (this.mode === 'ADAPTIVE' && (this.phase === 'A_GREEN' || this.phase === 'B_GREEN')) {
            const [activeGroup, inactiveGroup] = this.getPhaseGroups();
            const activeMaxQueue = Math.max(
                ...activeGroup.map(id => this.signals.get(id)?.queue.getQueueLength() ?? 0)
            );
            const inactiveMaxQueue = Math.max(
                ...inactiveGroup.map(id => this.signals.get(id)?.queue.getQueueLength() ?? 0)
            );
            const groupName = this.phase.startsWith('A') ? 'N/S' : 'E/W';

            if (activeMaxQueue === 0 && this.phaseTimer > 0) {
                // Early termination
                this.phaseTimer = 0;
                this.lastAdaptiveAction = `Early terminated ${groupName} phase (queue cleared)`;
            } else if (activeMaxQueue > this.adaptiveThreshold && activeMaxQueue > inactiveMaxQueue && this.adaptiveExtension < this.maxAdaptiveExtension) {
                // Extend only if active queue is greater than waiting queue
                const ext = Math.min(3, this.maxAdaptiveExtension - this.adaptiveExtension);
                this.phaseTimer += ext;
                this.adaptiveExtension += ext;
                this.lastAdaptiveAction = `Extended ${groupName} phase by ${ext}s`;
            }
        }

        if (this.phaseTimer <= 0) {
            this.advancePhase();
        }

        // Sync FSM objects to the current phase (so they report correct state/timer)
        this.syncFSMsToPhase();

        // ─── 2. Process each signal (arrivals, serving, metrics) ─────────
        const signalData: SignalTickData[] = [];
        const historyBatch: Array<{ signalId: number; queueLength: number; avgWaitTime: number; utilization: number; arrivalRate: number }> = [];

        for (const [signalId, unit] of this.signals) {
            const { fsm, queue } = unit;

            try {
                // Generate new vehicle arrivals
                const newVehicles = queue.generateArrivals(this.currentTick);

                // Batch-insert all arrivals for this signal in one DB round-trip
                if (newVehicles.length > 0) {
                    const logs = await VehicleLogModel.logArrivalBatch(signalId, newVehicles.length);
                    logs.forEach((log, i) => { newVehicles[i].dbId = log.id; });
                }

                // Serve vehicles if this signal is GREEN
                if (fsm.getState() === 'GREEN') {
                    const servedVehicles = queue.serveVehicles(this.currentTick);
                    for (const vehicle of servedVehicles) {
                        if (vehicle.dbId !== undefined) {
                            VehicleLogModel.logServed(vehicle.dbId)
                                .catch(err => console.error('VehicleLog served error:', err.message));
                        }
                    }
                }

                // Compute metrics and collect for batch insert
                const metrics = queue.computeMetrics();
                historyBatch.push({
                    signalId,
                    queueLength: metrics.queueLength,
                    avgWaitTime: metrics.Wq,
                    utilization: metrics.utilization,
                    arrivalRate: metrics.arrivalRate,
                });

                // Build signal tick data
                signalData.push({
                    signalId,
                    name: fsm.name,
                    state: fsm.getState(),
                    timeRemaining: fsm.getTimeRemaining(),
                    queueLength: metrics.queueLength,
                    theoreticalLq: metrics.Lq,
                    avgWaitTime: metrics.Wq,
                    utilization: metrics.utilization,
                    arrivalRate: metrics.arrivalRate,
                });
            } catch (err: any) {
                console.error(`Tick error for signal ${signalId}:`, err.message);
            }
        }

        // Flush all queue history snapshots in a single DB round-trip
        QueueHistoryModel.insertBatch(historyBatch)
            .catch(err => console.error('QueueHistory batch insert error:', err.message));

        // ─── 3. Emit tick event ──────────────────────────────────────────
        const tickData: TickData = {
            tick: this.currentTick,
            signals: signalData,
            mode: this.mode,
            adaptiveAction: this.lastAdaptiveAction,
        };

        if (this.onTick) {
            this.onTick(tickData);
        }
    }

    /**
     * Advance to the next phase in the cycle:
     *   A_GREEN → A_YELLOW → B_GREEN → B_YELLOW → A_GREEN ...
     */
    private advancePhase(): void {
        switch (this.phase) {
            case 'A_GREEN':
                this.phase = 'A_YELLOW';
                this.phaseTimer = this.yellowDuration;
                break;
            case 'A_YELLOW':
                this.phase = 'B_GREEN';
                this.phaseTimer = this.greenDuration;
                this.adaptiveExtension = 0; // Reset for the new green phase
                break;
            case 'B_GREEN':
                this.phase = 'B_YELLOW';
                this.phaseTimer = this.yellowDuration;
                break;
            case 'B_YELLOW':
                this.phase = 'A_GREEN';
                this.phaseTimer = this.greenDuration;
                this.adaptiveExtension = 0; // Reset for the new green phase
                break;
        }

        // Log phase transition
        const [activeGroup, , activeState] = this.getPhaseGroups();
        const groupName = (this.phase.startsWith('A') ? 'N/S' : 'E/W');
        console.log(`🚦 Phase → ${this.phase}: ${groupName} = ${activeState}, timer = ${this.phaseTimer}s`);

        // Update FSM states in database
        for (const [, unit] of this.signals) {
            SignalModel.updateState(unit.fsm.id, unit.fsm.getState()).catch((err) => {
                console.error(`Failed to update signal ${unit.fsm.id} state:`, err.message);
            });
        }
    }

    /**
     * Set adaptive threshold
     */
    setAdaptiveThreshold(threshold: number): void {
        this.adaptiveThreshold = threshold;
    }

    /**
     * Set simulation speed multiplier
     */
    setSpeed(multiplier: number): void {
        const validMultipliers = [1, 2, 5, 10];
        if (!validMultipliers.includes(multiplier)) {
            multiplier = 1;
        }

        this.speedMultiplier = multiplier;
        this.tickInterval = 1000 / multiplier;

        // Restart interval if running
        if (this.running && this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = setInterval(() => {
                this.tick();
            }, this.tickInterval);
        }
    }

    /**
     * Set simulation mode
     */
    setMode(mode: SimulationMode): void {
        this.mode = mode;
        // Reset adaptive extension when switching modes to avoid lingering state
        this.adaptiveExtension = 0;
        console.log(`🔄 Mode changed to: ${mode}`);
    }

    /**
     * Set arrival rate for all signals
     */
    setArrivalRate(lambda: number): void {
        this.arrivalRate = lambda;
        for (const [, unit] of this.signals) {
            unit.queue.setArrivalRate(lambda);
        }
    }

    getStatus() {
        return {
            running: this.running,
            currentTick: this.currentTick,
            mode: this.mode,
            signalCount: this.signals.size,
            speedMultiplier: this.speedMultiplier,
            arrivalRate: this.arrivalRate,
            adaptiveThreshold: this.adaptiveThreshold
        };
    }

    isRunning(): boolean {
        return this.running;
    }
}

// Singleton instance
export const simulationEngine = new SimulationEngine();
