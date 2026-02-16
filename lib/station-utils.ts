// Utility functions for station complex and borough lookups

import db from './db';

export interface StationComplexInfo {
    complexId: string;
    isComplex: boolean;
    stopName: string;
    displayName: string;
    borough: string;
    boroughName: string;
    cbd: boolean;
    daytimeRoutes: string;
    ada: boolean;
}

// Borough code to full name mapping
const BOROUGH_NAMES: Record<string, string> = {
    'M': 'Manhattan',
    'Bk': 'Brooklyn',
    'Q': 'Queens',
    'Bx': 'Bronx',
    'SI': 'Staten Island'
};

/**
 * Fetches station complex information for given GTFS stop IDs
 */
export async function fetchStationComplexInfo(
    stopIds: Set<string>
): Promise<Map<string, StationComplexInfo>> {
    const complexInfo = new Map<string, StationComplexInfo>();

    if (stopIds.size === 0) return complexInfo;

    // Query all complexes and check if our stop IDs are in their gtfs_stop_ids
    const rs = await db.execute({
        sql: `SELECT * FROM station_complexes`,
        args: []
    });

    for (const row of rs.rows) {
        const gtfsStopIds = (row.gtfs_stop_ids as string)?.split(',').map(id => id.trim()) || [];

        // Check if any of our target stop IDs are in this complex
        for (const stopId of stopIds) {
            // Match against parent station (without N/S suffix) or exact match
            const parentStopId = stopId.replace(/[NS]$/, '');

            if (gtfsStopIds.includes(stopId) || gtfsStopIds.includes(parentStopId)) {
                const info: StationComplexInfo = {
                    complexId: row.complex_id as string,
                    isComplex: row.is_complex === 1,
                    stopName: row.stop_name as string,
                    displayName: row.display_name as string,
                    borough: row.borough as string,
                    boroughName: BOROUGH_NAMES[row.borough as string] || row.borough as string,
                    cbd: row.cbd === 1,
                    daytimeRoutes: row.daytime_routes as string,
                    ada: row.ada === 1
                };
                complexInfo.set(stopId, info);
                complexInfo.set(parentStopId, info); // Also map parent ID
            }
        }
    }

    return complexInfo;
}

/**
 * Gets borough name from borough code
 */
export function getBoroughName(boroughCode: string): string {
    return BOROUGH_NAMES[boroughCode] || boroughCode;
}

/**
 * Creates direction labels based on route, direction, and destination
 * Examples: "Uptown & Bronx", "Downtown & Brooklyn", "Queens"
 */
export function createDirectionLabel(
    routeId: string,
    directionId: number,
    destination: string,
    borough?: string
): string {
    // For now, just return the destination (trip headsign)
    // TODO: Create route-specific mappings for better labels
    return destination;
}
