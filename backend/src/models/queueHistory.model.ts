import pool from '../config/db';

export interface QueueHistory {
    id: number;
    signal_id: number;
    timestamp: Date;
    queue_length: number;
    avg_wait_time: number;
    utilization: number;
    arrival_rate: number;
}

export const QueueHistoryModel = {
    // Insert a queue snapshot
    async insert(signalId: number, queueLength: number, avgWaitTime: number, utilization: number, arrivalRate: number): Promise<QueueHistory> {
        const result = await pool.query(
            `INSERT INTO queue_history (signal_id, queue_length, avg_wait_time, utilization, arrival_rate)
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [signalId, queueLength, avgWaitTime, utilization, arrivalRate]
        );
        return result.rows[0];
    },

    // Get history for a signal with optional limit
    async getBySignalId(signalId: number, limit: number = 100): Promise<QueueHistory[]> {
        const result = await pool.query(
            `SELECT * FROM queue_history WHERE signal_id = $1 ORDER BY timestamp DESC LIMIT $2`,
            [signalId, limit]
        );
        return result.rows;
    },

    // Get all history with optional limit
    async getAll(limit: number = 100): Promise<QueueHistory[]> {
        const result = await pool.query(
            `SELECT * FROM queue_history ORDER BY timestamp DESC LIMIT $1`,
            [limit]
        );
        return result.rows;
    },

    // Insert multiple queue snapshots in a single query
    async insertBatch(rows: Array<{ signalId: number; queueLength: number; avgWaitTime: number; utilization: number; arrivalRate: number }>): Promise<void> {
        if (rows.length === 0) return;
        const values: unknown[] = [];
        const placeholders = rows.map((row, i) => {
            const base = i * 5;
            values.push(row.signalId, row.queueLength, row.avgWaitTime, row.utilization, row.arrivalRate);
            return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5})`;
        });
        await pool.query(
            `INSERT INTO queue_history (signal_id, queue_length, avg_wait_time, utilization, arrival_rate) VALUES ${placeholders.join(', ')}`,
            values
        );
    },

    // Delete records older than the given number of hours
    async purgeOlderThan(intervalHours: number): Promise<number> {
        const result = await pool.query(
            `DELETE FROM queue_history WHERE timestamp < NOW() - ($1 || ' hours')::INTERVAL`,
            [intervalHours]
        );
        return result.rowCount ?? 0;
    },

    // Clear all history
    async clear(): Promise<void> {
        await pool.query('TRUNCATE TABLE queue_history RESTART IDENTITY');
    },

    // Get aggregated analytics summary across all signals
    async getAggregatedSummary(): Promise<any> {
        const result = await pool.query(`
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
