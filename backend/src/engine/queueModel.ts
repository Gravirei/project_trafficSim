import { generatePoissonArrivals } from '../utils/poisson';

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
    rho: number;          // Traffic intensity
    Lq: number;           // Average queue length
    Wq: number;           // Average wait time (seconds)
    utilization: number;  // Utilization percentage
    queueLength: number;  // Current actual queue length
    arrivalRate: number;  // Current λ
    serviceRate: number;  // Current μ
}

export interface QueuedVehicle {
    id: number;            // Local ID (not DB ID yet)
    arrivedAtTick: number; // Simulation tick when vehicle arrived
    dbId?: number;         // DB id from vehicle_log, set async after logArrival resolves
}

export class QueueModel {
    private queue: QueuedVehicle[] = [];
    private lambda: number;   // Arrival rate (vehicles per second)
    private mu: number;       // Service rate (vehicles per second during green)
    private nextVehicleId: number = 1;
    private totalServed: number = 0;
    private totalWaitTime: number = 0;
    private readonly maxQueueSize: number;

    /**
     * @param lambda - Average arrival rate (vehicles per second), default 0.5
     * @param mu - Service rate during green phase (vehicles per second), default 0.8
     * @param maxQueueSize - Maximum vehicles allowed in queue (balking), default 500
     */
    constructor(lambda: number = 0.5, mu: number = 1.2, maxQueueSize: number = 500) {
        this.lambda = lambda;
        this.mu = mu;
        this.maxQueueSize = maxQueueSize;
    }

    /**
     * Generate vehicle arrivals for this tick using Poisson distribution
     * @param currentTick - Current simulation tick
     * @returns The newly created QueuedVehicle objects (for DB logging)
     */
    generateArrivals(currentTick: number): QueuedVehicle[] {
        const count = generatePoissonArrivals(this.lambda);
        const newVehicles: QueuedVehicle[] = [];

        for (let i = 0; i < count; i++) {
            if (this.queue.length >= this.maxQueueSize) break; // Balking: drop arrivals when queue is full
            const vehicle: QueuedVehicle = {
                id: this.nextVehicleId++,
                arrivedAtTick: currentTick,
            };
            this.queue.push(vehicle);
            newVehicles.push(vehicle);
        }

        return newVehicles;
    }

    /**
     * Serve vehicles during GREEN phase
     * Uses Poisson process for number of vehicles served
     * @param currentTick - Current simulation tick
     * @returns The served QueuedVehicle objects (for DB logging)
     */
    serveVehicles(currentTick: number): QueuedVehicle[] {
        if (this.queue.length === 0) return [];

        // Number of vehicles that can be served this tick
        const toServe = Math.min(
            generatePoissonArrivals(this.mu),
            this.queue.length
        );

        const servedVehicles: QueuedVehicle[] = [];
        for (let i = 0; i < toServe; i++) {
            const vehicle = this.queue.shift()!;
            const waitTime = currentTick - vehicle.arrivedAtTick;
            this.totalWaitTime += waitTime;
            this.totalServed++;
            servedVehicles.push(vehicle);
        }

        return servedVehicles;
    }

    /**
     * Compute M/M/1 queuing theory metrics
     */
    computeMetrics(): QueueMetrics {
        const rho = this.mu > 0 ? this.lambda / this.mu : 0;

        let Lq: number;
        let Wq: number;

        if (rho >= 1) {
            // Unstable system — queue grows indefinitely
            Lq = this.queue.length; // Use actual queue length
            Wq = this.totalServed > 0 ? this.totalWaitTime / this.totalServed : 0;
        } else {
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

    getQueueLength(): number {
        return this.queue.length;
    }

    setArrivalRate(lambda: number): void {
        this.lambda = lambda;
    }

    setServiceRate(mu: number): void {
        this.mu = mu;
    }

    getArrivalRate(): number {
        return this.lambda;
    }

    /**
     * Reset queue and statistics
     */
    reset(): void {
        this.queue = [];
        this.nextVehicleId = 1;
        this.totalServed = 0;
        this.totalWaitTime = 0;
    }
}
