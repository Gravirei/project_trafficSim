export type SimulationMode = 'MANUAL' | 'ADAPTIVE';
export interface SignalTickData {
    signalId: number;
    name: string;
    state: 'GREEN' | 'YELLOW' | 'RED';
    timeRemaining: number;
    queueLength: number;
    avgWaitTime: number;
    utilization: number;
    arrivalRate: number;
}
export interface TickData {
    tick: number;
    signals: SignalTickData[];
    mode: SimulationMode;
}
export declare class SimulationEngine {
    private signals;
    private running;
    private currentTick;
    private intervalId;
    private tickInterval;
    private mode;
    private adaptiveThreshold;
    private speedMultiplier;
    private arrivalRate;
    private onTick;
    /**
     * Initialize the engine by loading signals from the database
     */
    initialize(): Promise<void>;
    /**
     * Set callback for tick events (used by WebSocket)
     */
    setOnTick(callback: (data: TickData) => void): void;
    /**
     * Start the simulation loop
     */
    start(): void;
    /**
     * Stop the simulation loop
     */
    stop(): void;
    /**
     * Reset the simulation
     */
    reset(): Promise<void>;
    /**
     * Execute one simulation tick
     */
    private tick;
    /**
     * Set simulation speed multiplier
     */
    setSpeed(multiplier: number): void;
    /**
     * Set simulation mode
     */
    setMode(mode: SimulationMode): void;
    /**
     * Set arrival rate for all signals
     */
    setArrivalRate(lambda: number): void;
    getStatus(): {
        running: boolean;
        currentTick: number;
        mode: SimulationMode;
        signalCount: number;
        speedMultiplier: number;
        arrivalRate: number;
    };
    isRunning(): boolean;
}
export declare const simulationEngine: SimulationEngine;
//# sourceMappingURL=simulationEngine.d.ts.map