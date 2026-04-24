export type SignalState = 'GREEN' | 'YELLOW' | 'RED';
/**
 * Finite State Machine for Traffic Signal
 * States: RED → GREEN → YELLOW → RED (deterministic cycle)
 *
 * Formal definition:
 *   Q = {GREEN, YELLOW, RED}
 *   Σ = {timer_expired}
 *   δ: deterministic transition function
 *   q₀ = RED (initial state)
 */
export declare class SignalFSM {
    id: number;
    name: string;
    private state;
    private timer;
    private greenDuration;
    private redDuration;
    private yellowDuration;
    private adaptiveExtension;
    private maxAdaptiveExtension;
    constructor(id: number, name: string, greenDuration?: number, redDuration?: number, yellowDuration?: number);
    /**
     * Advance the FSM by one tick (1 second)
     * Decrement timer and trigger state transition when timer hits 0
     * @returns true if a state transition occurred
     */
    tick(): boolean;
    /**
     * Deterministic state transition
     * RED → GREEN → YELLOW → RED
     */
    private transition;
    /**
     * Extend green phase in adaptive mode
     * Only works when currently in GREEN state
     */
    extendGreen(seconds: number): void;
    /**
     * Set adaptive extension for the next GREEN phase
     */
    setAdaptiveExtension(seconds: number): void;
    getState(): SignalState;
    getTimeRemaining(): number;
    /**
     * Update durations (for config changes while running)
     */
    updateDurations(green?: number, red?: number, yellow?: number): void;
    /**
     * Reset to initial RED state
     */
    reset(): void;
}
//# sourceMappingURL=signalFSM.d.ts.map