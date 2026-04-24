"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueueModel = void 0;
const poisson_1 = require("../utils/poisson");
class QueueModel {
    /**
     * @param lambda - Average arrival rate (vehicles per second), default 0.5
     * @param mu - Service rate during green phase (vehicles per second), default 0.8
     */
    constructor(lambda = 0.5, mu = 0.8) {
        this.queue = [];
        this.nextVehicleId = 1;
        this.totalServed = 0;
        this.totalWaitTime = 0;
        this.lambda = lambda;
        this.mu = mu;
    }
    /**
     * Generate vehicle arrivals for this tick using Poisson distribution
     * @param currentTick - Current simulation tick
     * @returns Number of new arrivals
     */
    generateArrivals(currentTick) {
        const arrivals = (0, poisson_1.generatePoissonArrivals)(this.lambda);
        for (let i = 0; i < arrivals; i++) {
            this.queue.push({
                id: this.nextVehicleId++,
                arrivedAtTick: currentTick,
            });
        }
        return arrivals;
    }
    /**
     * Serve vehicles during GREEN phase
     * Uses Poisson process for number of vehicles served
     * @param currentTick - Current simulation tick
     * @returns Number of vehicles served
     */
    serveVehicles(currentTick) {
        if (this.queue.length === 0)
            return 0;
        // Number of vehicles that can be served this tick
        const toServe = Math.min((0, poisson_1.generatePoissonArrivals)(this.mu), this.queue.length);
        for (let i = 0; i < toServe; i++) {
            const vehicle = this.queue.shift();
            const waitTime = currentTick - vehicle.arrivedAtTick;
            this.totalWaitTime += waitTime;
            this.totalServed++;
        }
        return toServe;
    }
    /**
     * Compute M/M/1 queuing theory metrics
     */
    computeMetrics() {
        const rho = this.mu > 0 ? this.lambda / this.mu : 0;
        let Lq;
        let Wq;
        if (rho >= 1) {
            // Unstable system — queue grows indefinitely
            Lq = this.queue.length; // Use actual queue length
            Wq = this.totalServed > 0 ? this.totalWaitTime / this.totalServed : 0;
        }
        else {
            // Stable M/M/1 formulas
            Lq = (rho * rho) / (1 - rho);
            Wq = this.lambda > 0 ? Lq / this.lambda : 0;
        }
        return {
            rho: Math.round(rho * 1000) / 1000,
            Lq: Math.round(Lq * 100) / 100,
            Wq: Math.round(Wq * 100) / 100,
            utilization: Math.round(rho * 10000) / 100, // percentage
            queueLength: this.queue.length,
            arrivalRate: this.lambda,
            serviceRate: this.mu,
        };
    }
    getQueueLength() {
        return this.queue.length;
    }
    setArrivalRate(lambda) {
        this.lambda = lambda;
    }
    setServiceRate(mu) {
        this.mu = mu;
    }
    getArrivalRate() {
        return this.lambda;
    }
    /**
     * Reset queue and statistics
     */
    reset() {
        this.queue = [];
        this.nextVehicleId = 1;
        this.totalServed = 0;
        this.totalWaitTime = 0;
    }
}
exports.QueueModel = QueueModel;
//# sourceMappingURL=queueModel.js.map