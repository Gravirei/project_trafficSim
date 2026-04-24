import { readFile } from 'fs/promises';
import path from 'path';
import pool from './db';

const REQUIRED_TABLES = ['signals', 'queue_history', 'vehicle_log'] as const;
const databaseDir = path.resolve(__dirname, '../../database');

async function readSqlFile(fileName: string): Promise<string> {
    const filePath = path.join(databaseDir, fileName);
    return readFile(filePath, 'utf8');
}

export async function ensureDatabaseReady(): Promise<void> {
    const client = await pool.connect();

    try {
        const result = await client.query<{ table_name: string }>(
            `SELECT table_name
             FROM information_schema.tables
             WHERE table_schema = 'public'
             AND table_name = ANY($1::text[])`,
            [REQUIRED_TABLES]
        );

        const existingTables = new Set(result.rows.map((row) => row.table_name));
        const missingTables = REQUIRED_TABLES.filter((tableName) => !existingTables.has(tableName));

        if (missingTables.length === 0) {
            return;
        }

        console.log(`🛠️  Initializing database schema (missing: ${missingTables.join(', ')})`);
        await client.query(await readSqlFile('schema.sql'));

        if (missingTables.includes('signals')) {
            await client.query(await readSqlFile('seed.sql'));
            console.log('🌱 Seeded default signals');
        }
    } finally {
        client.release();
    }
}
