"use strict";
/**
 * Poisson Random Arrival Generator
 * Generates random numbers following a Poisson distribution
 * using the inverse transform method.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.generatePoissonArrivals = generatePoissonArrivals;
exports.generateExponential = generateExponential;
/**
 * Generate number of arrivals in a time interval using Poisson distribution
 * @param lambda - Average arrival rate (vehicles per second)
 * @param deltaT - Time interval (seconds), default 1
 * @returns Number of arrivals in the interval
 */
function generatePoissonArrivals(lambda, deltaT = 1) {
    const L = Math.exp(-(lambda * deltaT));
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
function generateExponential(rate) {
    return -Math.log(1 - Math.random()) / rate;
}
//# sourceMappingURL=poisson.js.map