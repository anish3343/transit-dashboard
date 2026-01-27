import { createClient } from '@libsql/client';
import path from 'path';
import { getSchemaStatements } from './db-schema';

const url = process.env.TURSO_DATABASE_URL || `file:${path.join(process.cwd(), 'transit.db')}`;
const authToken = process.env.TURSO_AUTH_TOKEN;

const db = createClient({
    url,
    authToken,
});

// Initialize schema
let initializationPromise: Promise<void> | null = null;

export const initializeDatabase = async () => {
    if (!initializationPromise) {
        initializationPromise = (async () => {
            try {
                await db.batch(getSchemaStatements(), 'write');
            } catch (error) {
                console.error('Database initialization failed:', error);
                throw error;
            }
        })();
    }
    return initializationPromise;
};

// Auto-initialize on import, but expose promise for explicit control
initializeDatabase();

export default db;
