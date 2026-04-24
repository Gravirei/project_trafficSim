"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueueHistoryModel = void 0;
const db_1 = __importDefault(require("../config/db"));
exports.QueueHistoryModel = {
    // Insert a queue snapshot
    async insert(signalId, queueLength, avgWaitTime, utilization, arrivalRate) {
        const result = await db_1.default.query(`INSERT INTO queue_history (signal_id, queue_length, avg_wait_time, utilization, arrival_rate)
             VALUES ($1, $2, $3, $4, $5) RETURNING *`, [signalId, queueLength, avgWaitTime, utilization, arrivalRate]);
        return result.rows[0];
    },
    // Get history for a signal with optional limit
    async getBySignalId(signalId, limit = 100) {
        const result = await db_1.default.query(`SELECT * FROM queue_history WHERE signal_id = $1 ORDER BY timestamp DESC LIMIT $2`, [signalId, limit]);
        return result.rows;
    },
    // Get all history with optional limit
    async getAll(limit = 100) {
        const result = await db_1.default.query(`SELECT * FROM queue_history ORDER BY timestamp DESC LIMIT $1`, [limit]);
        return result.rows;
    },
    // Clear all history
    async clear() {
        await db_1.default.query('TRUNCATE TABLE queue_history RESTART IDENTITY');
    },
    // Get aggregated analytics summary across all signals
    async getAggregatedSummary() {
        const result = await db_1.default.query(`
            SELECT 
                COALESCE(AVG(avg_wait_time), 0) as system_avg_wait,
                COALESCE(MAX(queue_length), 0) as peak_queue_length,
                COALESCE(AVG(utilization), 0) as avg_utilization,
                COUNT(*) as total_records
            FROM queue_history
        `);
        return result.rows[0];
    }
};
//# sourceMappingURL=queueHistory.model.js.map