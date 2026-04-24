import pool from '../config/db';

export interface VehicleLog {
    id: number;
    signal_id: number;
    arrived_at: Date;
    served_at: Date | null;
    wait_seconds: number | null;
}

export const VehicleLogModel = {
    // Log a vehicle arrival
    async logArrival(signalId: number): Promise<VehicleLog> {
        const result = await pool.query(
            `INSERT INTO vehicle_log (signal_id, arrived_at) VALUES ($1, NOW()) RETURNING *`,
            [signalId]
        );
        return result.rows[0];
    },

    // Mark a vehicle as served
    async logServed(vehicleId: number): Promise<void> {
        await pool.query(
            `UPDATE vehicle_log SET served_at = NOW(), 
             wait_seconds = EXTRACT(EPOCH FROM (NOW() - arrived_at))
             WHERE id = $1`,
            [vehicleId]
        );
    },

    // Get unserved vehicles for a signal (vehicles in queue)
    async getQueuedVehicles(signalId: number): Promise<VehicleLog[]> {
        const result = await pool.query(
            `SELECT * FROM vehicle_log WHERE signal_id = $1 AND served_at IS NULL ORDER BY arrived_at`,
            [signalId]
        );
        return result.rows;
    },

    // Log multiple vehicle arrivals for a single signal in one query
    async logArrivalBatch(signalId: number, count: number): Promise<VehicleLog[]> {
        if (count === 0) return [];
        const result = await pool.query<VehicleLog>(
            `INSERT INTO vehicle_log (signal_id, arrived_at)
             SELECT $1, NOW() FROM generate_series(1, $2)
             RETURNING *`,
            [signalId, count]
        );
        return result.rows;
    },

    // Delete records older than the given number of hours
    async purgeOlderThan(intervalHours: number): Promise<number> {
        const result = await pool.query(
            `DELETE FROM vehicle_log WHERE arrived_at < NOW() - ($1 || ' hours')::INTERVAL`,
            [intervalHours]
        );
        return result.rowCount ?? 0;
    },

    // Clear all logs
    async clear(): Promise<void> {
        await pool.query('TRUNCATE TABLE vehicle_log RESTART IDENTITY');
    }
};
