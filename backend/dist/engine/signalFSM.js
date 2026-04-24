"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SignalFSM = void 0;
const signal_model_1 = require("../models/signal.model");
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
class SignalFSM {
    constructor(id, name, greenDuration = 30, redDuration = 30, yellowDuration = 5) {
        // Extra seconds added in adaptive mode
        this.adaptiveExtension = 0;
        this.maxAdaptiveExtension = 15;
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
    tick() {
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
    transition() {
        switch (this.state) {
            case 'RED':
                this.state = 'GREEN';
                this.timer = this.greenDuration + this.adaptiveExtension;
                this.adaptiveExtension = 0; // Reset extension after use
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
        signal_model_1.SignalModel.updateState(this.id, this.state).catch((err) => {
            console.error(`Failed to update signal ${this.id} state:`, err.message);
        });
    }
    /**
     * Extend green phase in adaptive mode
     * Only works when currently in GREEN state
     */
    extendGreen(seconds) {
        if (this.state === 'GREEN') {
            const extension = Math.min(seconds, this.maxAdaptiveExtension - this.adaptiveExtension);
            this.timer += extension;
            this.adaptiveExtension += extension;
        }
    }
    /**
     * Set adaptive extension for the next GREEN phase
     */
    setAdaptiveExtension(seconds) {
        this.adaptiveExtension = Math.min(seconds, this.maxAdaptiveExtension);
    }
    getState() {
        return this.state;
    }
    getTimeRemaining() {
        return this.timer;
    }
    /**
     * Update durations (for config changes while running)
     */
    updateDurations(green, red, yellow) {
        if (green !== undefined)
            this.greenDuration = green;
        if (red !== undefined)
            this.redDuration = red;
        if (yellow !== undefined)
            this.yellowDuration = yellow;
    }
    /**
     * Reset to initial RED state
     */
    reset() {
        this.state = 'RED';
        this.timer = this.redDuration;
        this.adaptiveExtension = 0;
    }
}
exports.SignalFSM = SignalFSM;
//# sourceMappingURL=signalFSM.js.map