import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getDropStatements, getSchemaStatements } from '@/lib/db-schema';

export async function POST() {
    // Security: Only allow in development
    if (process.env.NODE_ENV === 'production') {
        return NextResponse.json(
            { error: 'Database reset is not allowed in production' },
            { status: 403 }
        );
    }

    try {
        // Drop existing tables
        await db.batch(getDropStatements(), 'write');

        // Recreate tables with schema
        await db.batch(getSchemaStatements(), 'write');

        return NextResponse.json({
            success: true,
            message: 'Database reset and schema recreated.'
        });
    } catch (error) {
        console.error('Database reset failed:', error);
        return NextResponse.json(
            {
                error: 'Database reset failed',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}