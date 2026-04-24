/**
 * Poisson Random Arrival Generator
 * Generates random numbers following a Poisson distribution
 * using the inverse transform method.
 */

/**
 * Generate number of arrivals in a time interval using Poisson distribution
 * @param lambda - Average arrival rate (vehicles per second)
 * @param deltaT - Time interval (seconds), default 1
 * @returns Number of arrivals in the interval
 */
export function generatePoissonArrivals(lambda: number, deltaT: number = 1): number {
    const mean = lambda * deltaT;

    // Guard: Knuth's algorithm underflows to L=0 when mean > ~709, causing an infinite loop.
    // Switch to a normal approximation (Box-Muller) for large mean values.
    if (mean > 500) {
        const u1 = Math.random();
        const u2 = Math.random();
        const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
        return Math.max(0, Math.round(mean + Math.sqrt(mean) * z));
    }

    const L = Math.exp(-mean);
    let k = 0;
    let p = 1;

    do {
        k++;
        p *= Math.random();
    } while (p > L);

    return k - 1;
}

/**
 * Generate an exponentially distributed random variable
 * Used for service times in M/M/1 model
 * @param rate - Service rate (mu)
 * @returns Random service time
 */
export function generateExponential(rate: number): number {
    return -Math.log(1 - Math.random()) / rate;
}
