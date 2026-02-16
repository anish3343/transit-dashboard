import { NextResponse } from 'next/server';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const system = searchParams.get('system');

    // Build query based on system filter
    let query = 'SELECT DISTINCT system, stop_id, stop_name FROM stops';
    const params: string[] = [];

    if (system && system !== 'all') {
      query += ' WHERE system = ?';
      params.push(system);
    }

    query += ' ORDER BY system, stop_name';

    // Execute query
    const result = await db.execute({
      sql: query,
      args: params,
    });

    // Map stops to simple format
    // Note: Cannot determine routes per stop as database lacks stop_times table
    const stops = result.rows.map((row) => ({
      system: row.system as string,
      stopId: row.stop_id as string,
      stopName: row.stop_name as string,
    }));

    return NextResponse.json({ stops });
  } catch (error) {
    console.error('Failed to fetch stops:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stops', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
