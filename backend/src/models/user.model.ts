import pool from '../config/db';

export interface User {
    id: number;
    username: string;
    email: string | null;
    password_hash: string;
    role: 'ADMIN' | 'VIEWER';
    created_at: Date;
}

export const UserModel = {
    async findByUsername(username: string): Promise<User | null> {
        const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
        return result.rows[0] || null;
    },

    async findById(id: number): Promise<User | null> {
        const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
        return result.rows[0] || null;
    },

    async create(username: string, email: string, passwordHash: string, role: 'ADMIN' | 'VIEWER' = 'VIEWER'): Promise<Omit<User, 'password_hash'>> {
        const result = await pool.query(
            'INSERT INTO users (username, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, username, email, role, created_at',
            [username, email, passwordHash, role]
        );
        return result.rows[0];
    },

    async changePassword(id: number, passwordHash: string): Promise<boolean> {
        const result = await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [passwordHash, id]);
        return (result.rowCount ?? 0) > 0;
    }
};
