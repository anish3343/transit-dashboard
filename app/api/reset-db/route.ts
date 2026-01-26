import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
    try {
        // Drop existing tables
        await db.batch([
            'DROP TABLE IF EXISTS stops',
            'DROP TABLE IF EXISTS trips',
            'DROP TABLE IF EXISTS routes',
        ], 'write');

        // Recreate tables with new schema
        await db.batch([
            `CREATE TABLE IF NOT EXISTS stops (
                system TEXT,
                stop_id TEXT,
                stop_name TEXT,
                PRIMARY KEY (system, stop_id)
            )`,
            `CREATE TABLE IF NOT EXISTS trips (
                system TEXT,
                trip_id TEXT,
                route_id TEXT,
                trip_headsign TEXT,
                trip_short_name TEXT,
                direction_id INTEGER,
                PRIMARY KEY (system, trip_id)
            )`,
            `CREATE TABLE IF NOT EXISTS routes (
                system TEXT,
                route_id TEXT,
                route_short_name TEXT,
                route_long_name TEXT,
                route_color TEXT,
                route_text_color TEXT,
                PRIMARY KEY (system, route_id)
            )`
        ], 'write');

        return NextResponse.json({ message: 'Database reset and schema recreated.' });
    } catch (error) {
        console.error('Database reset failed:', error);
        return NextResponse.json({ error: 'Database reset failed' }, { status: 500 });
    }
}