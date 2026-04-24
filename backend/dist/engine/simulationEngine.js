"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.simulationEngine = exports.SimulationEngine = void 0;
const signalFSM_1 = require("./signalFSM");
const queueModel_1 = require("./queueModel");
const signal_model_1 = require("../models/signal.model");
const queueHistory_model_1 = require("../models/queueHistory.model");
const vehicleLog_model_1 = require("../models/vehicleLog.model");
class SimulationEngine {
    constructor() {
        this.signals = new Map();
        this.running = false;
        this.currentTick = 0;
        this.intervalId = null;
        this.tickInterval = 1000; // ms
        this.mode = 'MANUAL';
        this.adaptiveThreshold = 10; // Queue length threshold
        this.speedMultiplier = 1;
        this.arrivalRate = 0.5;
        this.onTick = null;
    }
    /**
     * Initialize the engine by loading signals from the database
     */
    async initialize() {
        const dbSignals = await signal_model_1.SignalModel.getAll();
        this.signals.clear();
        for (const signal of dbSignals) {
            const fsm = new signalFSM_1.SignalFSM(signal.id, signal.name, signal.green_duration, signal.red_duration, signal.yellow_duration);
            const queue = new queueModel_1.QueueModel(0.5, 0.8); // Default λ=0.5, μ=0.8
            this.signals.set(signal.id, { fsm, queue });
        }
        console.log(`🚦 Simulation engine initialized with ${this.signals.size} signals`);
    }
    /**
     * Set callback for tick events (used by WebSocket)
     */
    setOnTick(callback) {
        this.onTick = callback;
    }
    /**
     * Start the simulation loop
     */
    start() {
        if (this.running)
            return;
        this.running = true;
        this.intervalId = setInterval(() => {
            this.tick();
        }, this.tickInterval);
        console.log('▶️  Simulation started');
    }
    /**
     * Stop the simulation loop
     */
    stop() {
        if (!this.running)
            return;
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
    async reset() {
        this.stop();
        this.currentTick = 0;
        // Reset all FSMs and queues
        for (const [, unit] of this.signals) {
            unit.fsm.reset();
            unit.queue.reset();
        }
        // Clear DB logs
        await queueHistory_model_1.QueueHistoryModel.clear();
        await vehicleLog_model_1.VehicleLogModel.clear();
        // Reload signals from DB
        await this.initialize();
        console.log('↺  Simulation reset');
    }
    /**
     * Execute one simulation tick
     */
    async tick() {
        this.currentTick++;
        const signalData = [];
        for (const [signalId, unit] of this.signals) {
            const { fsm, queue } = unit;
            // 1. Advance signal FSM
            fsm.tick();
            // 2. Generate new vehicle arrivals
            const arrivals = queue.generateArrivals(this.currentTick);
            // 3. Serve vehicles if GREEN
            let served = 0;
            if (fsm.getState() === 'GREEN') {
                served = queue.serveVehicles(this.currentTick);
            }
            // 4. Adaptive mode: extend GREEN if queue exceeds threshold
            if (this.mode === 'ADAPTIVE' && fsm.getState() === 'GREEN') {
                if (queue.getQueueLength() > this.adaptiveThreshold) {
                    fsm.extendGreen(3); // Extend by 3 seconds per tick (up to max 15)
                }
            }
            // 5. Compute metrics
            const metrics = queue.computeMetrics();
            // 6. Save queue snapshot to DB (async, don't await to avoid tick delay)
            queueHistory_model_1.QueueHistoryModel.insert(signalId, metrics.queueLength, metrics.Wq, metrics.utilization, metrics.arrivalRate).catch(err => console.error('DB insert error:', err.message));
            // 7. Build signal tick data
            signalData.push({
                signalId,
                name: fsm.name,
                state: fsm.getState(),
                timeRemaining: fsm.getTimeRemaining(),
                queueLength: metrics.queueLength,
                avgWaitTime: metrics.Wq,
                utilization: metrics.utilization,
                arrivalRate: metrics.arrivalRate,
            });
        }
        // 8. Emit tick event via callback (WebSocket)
        const tickData = {
            tick: this.currentTick,
            signals: signalData,
            mode: this.mode,
        };
        if (this.onTick) {
            this.onTick(tickData);
        }
    }
    /**
     * Set simulation speed multiplier
     */
    setSpeed(multiplier) {
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
    setMode(mode) {
        this.mode = mode;
        console.log(`🔄 Mode changed to: ${mode}`);
    }
    /**
     * Set arrival rate for all signals
     */
    setArrivalRate(lambda) {
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
            arrivalRate: this.arrivalRate
        };
    }
    isRunning() {
        return this.running;
    }
}
exports.SimulationEngine = SimulationEngine;
// Singleton instance
exports.simulationEngine = new SimulationEngine();
//# sourceMappingURL=simulationEngine.js.map