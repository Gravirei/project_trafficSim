"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureDatabaseReady = ensureDatabaseReady;
const promises_1 = require("fs/promises");
const path_1 = __importDefault(require("path"));
const db_1 = __importDefault(require("./db"));
const REQUIRED_TABLES = ['signals', 'queue_history', 'vehicle_log'];
const databaseDir = path_1.default.resolve(__dirname, '../../database');
async function readSqlFile(fileName) {
    const filePath = path_1.default.join(databaseDir, fileName);
    return (0, promises_1.readFile)(filePath, 'utf8');
}
async function ensureDatabaseReady() {
    const client = await db_1.default.connect();
    try {
        const result = await client.query(`SELECT table_name
             FROM information_schema.tables
             WHERE table_schema = 'public'
             AND table_name = ANY($1::text[])`, [REQUIRED_TABLES]);
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
    }
    finally {
        client.release();
    }
}
//# sourceMappingURL=initDb.js.map