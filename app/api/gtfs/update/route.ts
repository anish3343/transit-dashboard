import { NextResponse } from 'next/server';
import axios from 'axios';
import AdmZip from 'adm-zip';
import { parse } from 'csv-parse/sync';
import db from '../../../../lib/db';
import { GTFS_STATIC_URLS } from '../../../../lib/stops';

export async function GET() {
    try {
        console.log('[gtfs-update] Starting GTFS static data update...');

        // We want Supplemented for Subway, plus MNR and Bus
        const feedsToUpdate = [
            { key: 'subway', url: GTFS_STATIC_URLS.subway_supplemented },
            { key: 'mnr', url: GTFS_STATIC_URLS.mnr },
            { key: 'bus', url: GTFS_STATIC_URLS.bus_manhattan },
        ];

        const results = [];

        for (const feed of feedsToUpdate) {
            try {
                console.log(`[gtfs-update] Downloading ${feed.key}...`);
                const response = await axios.get(feed.url, { responseType: 'arraybuffer' });
                const zip = new AdmZip(Buffer.from(response.data));

                // Helper to process a file
                const processFile = async (
                    filename: string,
                    tableName: string,
                    columns: string[],
                    transform: (row: any) => Record<string, any>
                ) => {
                    const entry = zip.getEntry(filename);
                    if (!entry) {
                        console.warn(`[gtfs-update] File ${filename} not found in ${feed.key} archive`);
                        return 0;
                    }

                    const content = entry.getData().toString('utf8');
                    const records = parse(content, { columns: true, skip_empty_lines: true });

                    // Batch in chunks to avoid hitting SQL variable limits or packet size limits
                    const BATCH_SIZE = 50;
                    for (let i = 0; i < records.length; i += BATCH_SIZE) {
                        const chunk = records.slice(i, i + BATCH_SIZE);
                        const statements = chunk.map((row: any) => ({
                            sql: `INSERT OR REPLACE INTO ${tableName} (${columns.join(', ')}) VALUES (${columns.map(c => '@' + c).join(', ')})`,
                            args: transform(row)
                        }));
                        await db.batch(statements, 'write');
                    }
                    console.log(`[gtfs-update] Updated ${tableName} for ${feed.key}: ${records.length} rows`);
                    return records.length;
                };

                // Process Stops
                const stopsCount = await processFile('stops.txt', 'stops', ['system', 'stop_id', 'stop_name'], (row) => ({
                    system: feed.key,
                    stop_id: row.stop_id,
                    stop_name: row.stop_name
                }));

                // Process Trips
                const tripsCount = await processFile('trips.txt', 'trips', ['system', 'trip_id', 'route_id', 'trip_headsign', 'trip_short_name', 'direction_id'], (row) => {
                    let shortName = row.trip_short_name || '';

                    // Special handling for Subway:
                    // Realtime feed often uses "052150_6..N" but Static has "A2023..._052150_6..N"
                    // We extract the suffix to use as a short name for matching.
                    if (feed.key === 'subway' && !shortName) {
                        const match = row.trip_id.match(/_(\d{6}_.+)$/);
                        if (match) {
                            shortName = match[1];
                        }
                    }

                    // Special handling for MNR: Fallback to trip_id if short name is missing
                    if (feed.key === 'mnr' && !shortName) {
                        shortName = row.trip_id;
                    }

                    return {
                        system: feed.key,
                        trip_id: row.trip_id,
                        route_id: row.route_id,
                        trip_headsign: row.trip_headsign,
                        trip_short_name: shortName,
                        direction_id: row.direction_id
                    };
                });

                // Process Routes
                const routesCount = await processFile('routes.txt', 'routes', ['system', 'route_id', 'route_short_name', 'route_long_name', 'route_color', 'route_text_color'], (row) => ({
                    system: feed.key,
                    route_id: row.route_id,
                    route_short_name: row.route_short_name,
                    route_long_name: row.route_long_name,
                    route_color: row.route_color,
                    route_text_color: row.route_text_color
                }));

                results.push({
                    feed: feed.key,
                    status: 'success',
                    stops: stopsCount,
                    trips: tripsCount,
                    routes: routesCount
                });

            } catch (error) {
                console.error(`[gtfs-update] Failed to update ${feed.key}:`, error);
                results.push({
                    feed: feed.key,
                    status: 'failed',
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        }

        return NextResponse.json({
            success: true,
            timestamp: Date.now(),
            results
        });

    } catch (error) {
        console.error('[gtfs-update] GTFS Update Failed:', error);
        return NextResponse.json(
            {
                error: 'Update failed',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}
