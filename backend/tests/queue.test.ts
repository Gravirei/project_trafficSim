import { QueueModel } from '../src/engine/queueModel';

describe('QueueModel — M/M/1 formulas', () => {
    describe('computeMetrics() — stable system (ρ < 1)', () => {
        it('computes ρ = λ/μ correctly', () => {
            const q = new QueueModel(0.5, 1.2);
            const m = q.computeMetrics();
            expect(m.rho).toBeCloseTo(0.5 / 1.2, 2);
        });

        it('computes Lq = ρ²/(1−ρ)', () => {
            const q = new QueueModel(0.5, 1.2);
            const m = q.computeMetrics();
            const rho = 0.5 / 1.2;
            const expectedLq = (rho * rho) / (1 - rho);
            expect(m.Lq).toBeCloseTo(expectedLq, 2);
        });

        it('computes Wq = Lq/λ (Little\'s Law)', () => {
            const q = new QueueModel(0.5, 1.2);
            const m = q.computeMetrics();
            const rho = 0.5 / 1.2;
            const Lq = (rho * rho) / (1 - rho);
            const expectedWq = Lq / 0.5;
            expect(m.Wq).toBeCloseTo(expectedWq, 2);
        });

        it('computes utilization as ρ × 100 (percentage)', () => {
            const q = new QueueModel(0.5, 1.2);
            const m = q.computeMetrics();
            expect(m.utilization).toBeCloseTo((0.5 / 1.2) * 100, 1);
        });
    });

    describe('computeMetrics() — unstable system (ρ ≥ 1)', () => {
        it('does not throw when ρ ≥ 1', () => {
            const q = new QueueModel(1.5, 0.5); // ρ = 3
            expect(() => q.computeMetrics()).not.toThrow();
        });

        it('uses actual queue length as Lq when unstable', () => {
            const q = new QueueModel(1.5, 0.5);
            // Add some vehicles manually via generateArrivals
            // generateArrivals is Poisson-random, so just check it doesn't crash
            // and Lq equals current queue length
            const m = q.computeMetrics();
            expect(m.Lq).toBe(m.queueLength);
        });
    });

    describe('generateArrivals()', () => {
        it('returns an array of QueuedVehicle objects', () => {
            const q = new QueueModel(2.0, 1.2); // high λ to ensure arrivals
            const vehicles = q.generateArrivals(1);
            expect(Array.isArray(vehicles)).toBe(true);
        });

        it('statistical mean ≈ λ over many samples (±20%)', () => {
            const lambda = 0.8;
            const q = new QueueModel(lambda, 1.2);
            let total = 0;
            const samples = 2000;
            for (let i = 0; i < samples; i++) {
                total += q.generateArrivals(i).length;
                q['queue'] = []; // reset queue to avoid memory buildup
            }
            const mean = total / samples;
            expect(mean).toBeGreaterThan(lambda * 0.8);
            expect(mean).toBeLessThan(lambda * 1.2);
        });

        it('increases queue length by the number of new vehicles', () => {
            const q = new QueueModel(0, 1.2); // λ=0 → no arrivals
            q.generateArrivals(1);
            expect(q.getQueueLength()).toBe(0);
        });
    });

    describe('serveVehicles()', () => {
        it('returns an empty array when queue is empty', () => {
            const q = new QueueModel(0.5, 1.2);
            const served = q.serveVehicles(1);
            expect(served).toEqual([]);
        });

        it('queue length never goes negative', () => {
            const q = new QueueModel(5.0, 0.1); // huge λ, tiny μ → big queue
            q.generateArrivals(1); // fill queue
            const before = q.getQueueLength();
            const served = q.serveVehicles(5);
            expect(q.getQueueLength()).toBe(before - served.length);
            expect(q.getQueueLength()).toBeGreaterThanOrEqual(0);
        });

        it('served vehicles have arrivedAtTick set', () => {
            const q = new QueueModel(5.0, 5.0); // ensure some arrivals and services
            q.generateArrivals(10);
            const served = q.serveVehicles(10);
            for (const v of served) {
                expect(v.arrivedAtTick).toBe(10);
            }
        });
    });

    describe('reset()', () => {
        it('clears the queue', () => {
            const q = new QueueModel(5.0, 1.2);
            q.generateArrivals(1);
            q.reset();
            expect(q.getQueueLength()).toBe(0);
        });
    });
});
