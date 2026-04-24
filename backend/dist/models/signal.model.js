"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SignalModel = void 0;
const db_1 = __importDefault(require("../config/db"));
exports.SignalModel = {
    // Get all signals
    async getAll() {
        const result = await db_1.default.query('SELECT * FROM signals ORDER BY id');
        return result.rows;
    },
    // Get a signal by ID
    async getById(id) {
        const result = await db_1.default.query('SELECT * FROM signals WHERE id = $1', [id]);
        return result.rows[0] || null;
    },
    // Create a new signal
    async create(name, greenDuration = 30, redDuration = 30, yellowDuration = 5) {
        const result = await db_1.default.query(`INSERT INTO signals (name, green_duration, red_duration, yellow_duration)
             VALUES ($1, $2, $3, $4) RETURNING *`, [name, greenDuration, redDuration, yellowDuration]);
        return result.rows[0];
    },
    // Update signal configuration
    async update(id, data) {
        const fields = [];
        const values = [];
        let paramIndex = 1;
        if (data.name !== undefined) {
            fields.push(`name = $${paramIndex++}`);
            values.push(data.name);
        }
        if (data.green_duration !== undefined) {
            fields.push(`green_duration = $${paramIndex++}`);
            values.push(data.green_duration);
        }
        if (data.red_duration !== undefined) {
            fields.push(`red_duration = $${paramIndex++}`);
            values.push(data.red_duration);
        }
        if (data.yellow_duration !== undefined) {
            fields.push(`yellow_duration = $${paramIndex++}`);
            values.push(data.yellow_duration);
        }
        if (fields.length === 0)
            return this.getById(id);
        values.push(id);
        const result = await db_1.default.query(`UPDATE signals SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`, values);
        return result.rows[0] || null;
    },
    // Update current state
    async updateState(id, state) {
        await db_1.default.query('UPDATE signals SET current_state = $1 WHERE id = $2', [state, id]);
    },
    // Delete a signal
    async delete(id) {
        const result = await db_1.default.query('DELETE FROM signals WHERE id = $1', [id]);
        return (result.rowCount ?? 0) > 0;
    }
};
//# sourceMappingURL=signal.model.js.map