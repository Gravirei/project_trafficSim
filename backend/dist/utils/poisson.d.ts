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
export declare function generatePoissonArrivals(lambda: number, deltaT?: number): number;
/**
 * Generate an exponentially distributed random variable
 * Used for service times in M/M/1 model
 * @param rate - Service rate (mu)
 * @returns Random service time
 */
export declare function generateExponential(rate: number): number;
//# sourceMappingURL=poisson.d.ts.map