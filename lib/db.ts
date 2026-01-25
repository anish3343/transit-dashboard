import { createClient } from '@libsql/client';
import path from 'path';

const url = process.env.TURSO_DATABASE_URL || `file:${path.join(process.cwd(), 'transit.db')}`;
const authToken = process.env.TURSO_AUTH_TOKEN;

const db = createClient({
    url,
    authToken,
});

// Initialize schema
(async () => {
    try {
        await db.batch([
            `CREATE TABLE IF NOT EXISTS stops (
                stop_id TEXT PRIMARY KEY,
                stop_name TEXT
            )`,
            `CREATE TABLE IF NOT EXISTS trips (
                trip_id TEXT PRIMARY KEY,
                route_id TEXT,
                trip_headsign TEXT,
                trip_short_name TEXT,
                direction_id INTEGER
            )`,
            `CREATE TABLE IF NOT EXISTS routes (
                route_id TEXT PRIMARY KEY,
                route_short_name TEXT,
                route_long_name TEXT,
                route_color TEXT,
                route_text_color TEXT
            )`
        ], 'write');
    } catch (error) {
        console.error('Database initialization failed:', error);
    }
})();

export default db;
