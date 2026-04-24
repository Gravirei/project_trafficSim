import pool from '../config/db';

export interface Signal {
    id: number;
    name: string;
    current_state: 'GREEN' | 'YELLOW' | 'RED';
    green_duration: number;
    red_duration: number;
    yellow_duration: number;
    created_at: Date;
}

export const SignalModel = {
    // Get all signals
    async getAll(): Promise<Signal[]> {
        const result = await pool.query('SELECT * FROM signals ORDER BY id');
        return result.rows;
    },

    // Get a signal by ID
    async getById(id: number): Promise<Signal | null> {
        const result = await pool.query('SELECT * FROM signals WHERE id = $1', [id]);
        return result.rows[0] || null;
    },

    // Create a new signal
    async create(name: string, greenDuration: number = 30, redDuration: number = 30, yellowDuration: number = 5): Promise<Signal> {
        const result = await pool.query(
            `INSERT INTO signals (name, green_duration, red_duration, yellow_duration)
             VALUES ($1, $2, $3, $4) RETURNING *`,
            [name, greenDuration, redDuration, yellowDuration]
        );
        return result.rows[0];
    },

    // Update signal configuration
    async update(id: number, data: Partial<Pick<Signal, 'green_duration' | 'red_duration' | 'yellow_duration' | 'name'>>): Promise<Signal | null> {
        const fields: string[] = [];
        const values: any[] = [];
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

        if (fields.length === 0) return this.getById(id);

        values.push(id);
        const result = await pool.query(
            `UPDATE signals SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
            values
        );
        return result.rows[0] || null;
    },

    // Update current state
    async updateState(id: number, state: 'GREEN' | 'YELLOW' | 'RED'): Promise<void> {
        await pool.query('UPDATE signals SET current_state = $1 WHERE id = $2', [state, id]);
    },

    // Delete a signal
    async delete(id: number): Promise<boolean> {
        const result = await pool.query('DELETE FROM signals WHERE id = $1', [id]);
        return (result.rowCount ?? 0) > 0;
    }
};
