import { NextResponse } from 'next/server';
import axios from 'axios';
import db from '../../../../lib/db';

export async function GET() {
    try {
        console.log('[stations-update] Starting NY Open Data station complexes update...');

        const appToken = process.env.NY_OPEN_DATA_APP_TOKEN;

        // Fetch all station complex data from NY Open Data API
        const url = 'https://data.ny.gov/api/v3/views/5f5g-n3cz/query.json';

        const headers: any = {
            'Content-Type': 'application/json'
        };

        if (appToken) {
            headers['X-App-Token'] = appToken;
        }

        const response = await axios.post(url, {
            query: 'SELECT *',
            page: {
                pageNumber: 1,
                pageSize: 5000
            },
            includeSynthetic: false
        }, { headers });

        // The response is directly an array of stations
        const stations = Array.isArray(response.data) ? response.data : [];

        console.log(`[stations-update] Fetched ${stations.length} station complexes`);
        if (stations.length > 0) {
            console.log('[stations-update] First station sample:', JSON.stringify(stations[0]).slice(0, 200));
        }

        // Batch insert station complex data
        const BATCH_SIZE = 50;
        for (let i = 0; i < stations.length; i += BATCH_SIZE) {
            const chunk = stations.slice(i, i + BATCH_SIZE);
            const statements = chunk.map((station: any) => ({
                sql: `INSERT OR REPLACE INTO station_complexes (
                    complex_id,
                    is_complex,
                    number_of_stations,
                    stop_name,
                    display_name,
                    gtfs_stop_ids,
                    borough,
                    cbd,
                    daytime_routes,
                    structure_type,
                    latitude,
                    longitude,
                    ada
                ) VALUES (
                    @complex_id,
                    @is_complex,
                    @number_of_stations,
                    @stop_name,
                    @display_name,
                    @gtfs_stop_ids,
                    @borough,
                    @cbd,
                    @daytime_routes,
                    @structure_type,
                    @latitude,
                    @longitude,
                    @ada
                )`,
                args: {
                    complex_id: station.complex_id,
                    is_complex: station.is_complex === 'true' ? 1 : 0,
                    number_of_stations: parseInt(station.number_of_stations_in_complex) || 0,
                    stop_name: station.stop_name || '',
                    display_name: station.display_name || '',
                    gtfs_stop_ids: station.gtfs_stop_ids || '',
                    borough: station.borough || '',
                    cbd: station.cbd === 'true' ? 1 : 0,
                    daytime_routes: station.daytime_routes || '',
                    structure_type: station.structure_type || '',
                    latitude: parseFloat(station.latitude) || null,
                    longitude: parseFloat(station.longitude) || null,
                    ada: parseInt(station.ada) || 0
                }
            }));
            await db.batch(statements, 'write');
        }

        console.log('[stations-update] Station complexes update complete');

        return NextResponse.json({
            success: true,
            timestamp: Date.now(),
            stations_loaded: stations.length
        });

    } catch (error) {
        console.error('[stations-update] Station complexes update failed:', error);
        return NextResponse.json(
            {
                error: 'Update failed',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}
