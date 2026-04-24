import { SignalModel } from '../models/signal.model';

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
export class SignalFSM {
    public id: number;
    public name: string;
    private state: SignalState;
    private timer: number;
    private greenDuration: number;
    private redDuration: number;
    private yellowDuration: number;

    constructor(
        id: number,
        name: string,
        greenDuration: number = 30,
        redDuration: number = 30,
        yellowDuration: number = 5
    ) {
        this.id = id;
        this.name = name;
        this.state = 'RED';
        this.greenDuration = greenDuration;
        this.redDuration = redDuration;
        this.yellowDuration = yellowDuration;
        this.timer = redDuration; // Start in RED state
    }

    /**
     * Advance the FSM by one tick (1 second)
     * Decrement timer and trigger state transition when timer hits 0
     * @returns true if a state transition occurred
     */
    tick(): boolean {
        this.timer--;

        if (this.timer <= 0) {
            this.transition();
            return true;
        }

        return false;
    }

    /**
     * Deterministic state transition
     * RED → GREEN → YELLOW → RED
     */
    private transition(): void {
        switch (this.state) {
            case 'RED':
                this.state = 'GREEN';
                this.timer = this.greenDuration;
                break;
            case 'GREEN':
                this.state = 'YELLOW';
                this.timer = this.yellowDuration;
                break;
            case 'YELLOW':
                this.state = 'RED';
                this.timer = this.redDuration;
                break;
        }

        // Update state in database
        SignalModel.updateState(this.id, this.state).catch((err) => {
            console.error(`Failed to update signal ${this.id} state:`, err.message);
        });
    }

    getState(): SignalState {
        return this.state;
    }

    getTimeRemaining(): number {
        return this.timer;
    }

    /**
     * Update durations (for config changes while running)
     */
    updateDurations(green?: number, red?: number, yellow?: number): void {
        if (green !== undefined) this.greenDuration = green;
        if (red !== undefined) this.redDuration = red;
        if (yellow !== undefined) this.yellowDuration = yellow;
    }

    /**
     * Fast-forward the FSM by N ticks without writing to the database.
     * Used at initialization to offset signals so they don't all start in RED.
     */
    advanceSilent(ticks: number): void {
        for (let i = 0; i < ticks; i++) {
            this.timer--;
            if (this.timer <= 0) {
                // Duplicate transition logic without the DB call
                switch (this.state) {
                    case 'RED':
                        this.state = 'GREEN';
                        this.timer = this.greenDuration;
                        break;
                    case 'GREEN':
                        this.state = 'YELLOW';
                        this.timer = this.yellowDuration;
                        break;
                    case 'YELLOW':
                        this.state = 'RED';
                        this.timer = this.redDuration;
                        break;
                }
            }
        }
    }

    /**
     * Force the FSM into a specific state with a given timer.
     * Used by the centralized phase controller to keep FSMs in sync
     * without relying on independent timers.
     */
    forceState(state: SignalState, timer: number): void {
        this.state = state;
        this.timer = timer;
    }

    /**
     * Reset to initial RED state
     */
    reset(): void {
        this.state = 'RED';
        this.timer = this.redDuration;
    }
}
