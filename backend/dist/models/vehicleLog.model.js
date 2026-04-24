"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VehicleLogModel = void 0;
const db_1 = __importDefault(require("../config/db"));
exports.VehicleLogModel = {
    // Log a vehicle arrival
    async logArrival(signalId) {
        const result = await db_1.default.query(`INSERT INTO vehicle_log (signal_id, arrived_at) VALUES ($1, NOW()) RETURNING *`, [signalId]);
        return result.rows[0];
    },
    // Mark a vehicle as served
    async logServed(vehicleId) {
        await db_1.default.query(`UPDATE vehicle_log SET served_at = NOW(), 
             wait_seconds = EXTRACT(EPOCH FROM (NOW() - arrived_at))
             WHERE id = $1`, [vehicleId]);
    },
    // Get unserved vehicles for a signal (vehicles in queue)
    async getQueuedVehicles(signalId) {
        const result = await db_1.default.query(`SELECT * FROM vehicle_log WHERE signal_id = $1 AND served_at IS NULL ORDER BY arrived_at`, [signalId]);
        return result.rows;
    },
    // Clear all logs
    async clear() {
        await db_1.default.query('TRUNCATE TABLE vehicle_log RESTART IDENTITY');
    }
};
//# sourceMappingURL=vehicleLog.model.js.map