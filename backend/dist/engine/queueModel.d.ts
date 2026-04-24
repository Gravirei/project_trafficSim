/**
 * M/M/1 Queue Model
 *
 * Metrics:
 *   ρ  = λ / μ           (Traffic intensity, must be < 1 for stability)
 *   Lq = ρ² / (1 − ρ)    (Average queue length)
 *   Wq = Lq / λ          (Average wait time in seconds)
 *   U  = ρ × 100%        (System utilization)
 */
export interface QueueMetrics {
    rho: number;
    Lq: number;
    Wq: number;
    utilization: number;
    queueLength: number;
    arrivalRate: number;
    serviceRate: number;
}
export declare class QueueModel {
    private queue;
    private lambda;
    private mu;
    private nextVehicleId;
    private totalServed;
    private totalWaitTime;
    /**
     * @param lambda - Average arrival rate (vehicles per second), default 0.5
     * @param mu - Service rate during green phase (vehicles per second), default 0.8
     */
    constructor(lambda?: number, mu?: number);
    /**
     * Generate vehicle arrivals for this tick using Poisson distribution
     * @param currentTick - Current simulation tick
     * @returns Number of new arrivals
     */
    generateArrivals(currentTick: number): number;
    /**
     * Serve vehicles during GREEN phase
     * Uses Poisson process for number of vehicles served
     * @param currentTick - Current simulation tick
     * @returns Number of vehicles served
     */
    serveVehicles(currentTick: number): number;
    /**
     * Compute M/M/1 queuing theory metrics
     */
    computeMetrics(): QueueMetrics;
    getQueueLength(): number;
    setArrivalRate(lambda: number): void;
    setServiceRate(mu: number): void;
    getArrivalRate(): number;
    /**
     * Reset queue and statistics
     */
    reset(): void;
}
//# sourceMappingURL=queueModel.d.ts.map