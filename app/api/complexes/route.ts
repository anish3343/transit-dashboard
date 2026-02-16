import { NextResponse } from 'next/server';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

interface RouteInfo {
  routeId: string;
  routeShortName: string | null;
  routeLongName: string | null;
  routeColor: string | null;
  routeTextColor: string | null;
}

interface ComplexInfo {
  complexId: string;
  displayName: string;
  borough: string;
  boroughName: string;
  system: string;
  routes: RouteInfo[];
  stopIds: string[]; // All directional stop IDs (e.g., ["101N", "101S"])
  parentStopIds: string[]; // Parent stop IDs (e.g., ["101"])
}

const BOROUGH_NAMES: Record<string, string> = {
  'M': 'Manhattan',
  'Bk': 'Brooklyn',
  'Q': 'Queens',
  'Bx': 'Bronx',
  'SI': 'Staten Island'
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const system = searchParams.get('system');

    // For subway, use station complexes
    if (!system || system === 'all' || system === 'subway') {
      const complexes = await getSubwayComplexes();

      // If filtering by subway only, return just complexes
      if (system === 'subway') {
        return NextResponse.json({ complexes });
      }

      // For 'all', also get bus and mnr stops
      const busStops = await getNonSubwayStops('bus');
      const mnrStops = await getNonSubwayStops('mnr');

      return NextResponse.json({
        complexes: [...complexes, ...busStops, ...mnrStops]
      });
    }

    // For bus or mnr, return regular stops
    const stops = await getNonSubwayStops(system);
    return NextResponse.json({ complexes: stops });

  } catch (error) {
    console.error('Failed to fetch complexes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch complexes', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

async function getSubwayComplexes(): Promise<ComplexInfo[]> {
  // Get all station complexes
  const complexResult = await db.execute({
    sql: 'SELECT * FROM station_complexes ORDER BY display_name',
    args: []
  });

  const complexes: ComplexInfo[] = [];

  for (const row of complexResult.rows) {
    // Parse gtfs_stop_ids - they are semicolon-separated
    const gtfsStopIds = (row.gtfs_stop_ids as string)?.split(';').map(id => id.trim()).filter(id => id) || [];

    if (gtfsStopIds.length === 0) continue;

    // Get all stops matching these IDs (including directional N/S variants)
    const placeholders = gtfsStopIds.map(() => '?').join(',');
    const stopsResult = await db.execute({
      sql: `
        SELECT DISTINCT stop_id, parent_station
        FROM stops
        WHERE system = 'subway'
          AND (stop_id IN (${placeholders}) OR parent_station IN (${placeholders}))
      `,
      args: [...gtfsStopIds, ...gtfsStopIds]
    });

    // Collect directional stops and parent stops separately
    const directionalStops = new Set<string>();
    const parentStops = new Set<string>();
    const allStopIds = new Set<string>();

    for (const stopRow of stopsResult.rows) {
      const stopId = stopRow.stop_id as string;
      const parentStation = stopRow.parent_station as string | null;

      allStopIds.add(stopId);

      // Classify as directional or parent
      if (stopId.match(/[NS]$/)) {
        // This is a directional stop
        directionalStops.add(stopId);
      } else {
        // This is a parent stop
        parentStops.add(stopId);
      }
    }

    // Use directional stops if available, otherwise use parent stops
    const stopsToUse = directionalStops.size > 0 ? Array.from(directionalStops) : Array.from(parentStops);
    const parentStopIds = Array.from(parentStops);

    // Get all routes serving these stops
    // We need to find which routes use these stops from the routes table
    // Since we don't have stop_times, we'll infer from daytime_routes in station_complexes
    const daytimeRoutes = (row.daytime_routes as string)?.split(' ').filter(r => r.trim()) || [];

    const routes: RouteInfo[] = [];

    if (daytimeRoutes.length > 0) {
      const routePlaceholders = daytimeRoutes.map(() => '?').join(',');
      const routesResult = await db.execute({
        sql: `
          SELECT DISTINCT route_id, route_short_name, route_long_name, route_color, route_text_color
          FROM routes
          WHERE system = 'subway' AND route_id IN (${routePlaceholders})
          ORDER BY route_id
        `,
        args: daytimeRoutes
      });

      for (const routeRow of routesResult.rows) {
        routes.push({
          routeId: routeRow.route_id as string,
          routeShortName: routeRow.route_short_name as string | null,
          routeLongName: routeRow.route_long_name as string | null,
          routeColor: routeRow.route_color as string | null,
          routeTextColor: routeRow.route_text_color as string | null,
        });
      }
    }

    complexes.push({
      complexId: row.complex_id as string,
      displayName: row.stop_name as string, // Use stop_name instead of display_name
      borough: row.borough as string,
      boroughName: BOROUGH_NAMES[row.borough as string] || row.borough as string,
      system: 'subway',
      routes,
      stopIds: stopsToUse, // Use only directional stops if available, otherwise parent stops
      parentStopIds
    });
  }

  return complexes;
}

async function getNonSubwayStops(system: string): Promise<ComplexInfo[]> {
  // For bus and MNR, each stop is its own "complex"
  const result = await db.execute({
    sql: `
      SELECT DISTINCT s.stop_id, s.stop_name, s.parent_station
      FROM stops s
      WHERE s.system = ?
      ORDER BY s.stop_name
    `,
    args: [system]
  });

  const stops: ComplexInfo[] = [];

  for (const row of result.rows) {
    // Get routes for this stop - we don't have stop_times, so we can't determine routes
    // For now, return empty routes array
    stops.push({
      complexId: row.stop_id as string,
      displayName: row.stop_name as string,
      borough: '',
      boroughName: '',
      system,
      routes: [],
      stopIds: [row.stop_id as string],
      parentStopIds: row.parent_station ? [row.parent_station as string] : []
    });
  }

  return stops;
}
