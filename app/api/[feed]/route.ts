import { NextResponse } from 'next/server';
import GtfsRealtimeBindings from 'gtfs-realtime-bindings';
import axios from 'axios';
import { STATIONS, FEEDS } from '../../../lib/stops';
import db from '@/lib/db';

export async function GET(request: Request, props: { params: Promise<{ feed: string }> }) {
    try {
        const params = await props.params;
        const feedKey = params.feed;
        const feedConfig = FEEDS[feedKey as keyof typeof FEEDS];

        if (!feedConfig) {
            return NextResponse.json({ error: `Feed ${feedKey} not configured` }, { status: 404 });
        }

        const axiosConfig: any = {
            method: 'GET',
            url: feedConfig.url,
            responseType: 'arraybuffer',
        };

        if ('apiKeyEnv' in feedConfig) {
            const { apiKeyEnv, authType } = feedConfig as any;
            const apiKey = process.env[apiKeyEnv];

            if (!apiKey) {
                console.error(`Missing API key for ${feedKey}`);
                return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
            }

            if (authType === 'header') {
                axiosConfig.headers = { 'x-api-key': apiKey };
            } else if (authType === 'query') {
                axiosConfig.params = { key: apiKey };
            }
        }

        const response = await axios(axiosConfig);

        const feed = GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(
            new Uint8Array(response.data)
        );

        // Filter for stations belonging to this feed
        const feedStations = STATIONS.filter(s => s.feed === feedKey);
        const targetStopIds = new Set(feedStations.map(s => s.stopId));

        // Identify trips that are relevant to our target stops so we can fetch headsigns in bulk
        const relevantEntities = feed.entity.filter((entity) => entity.tripUpdate);
        const tripIdsToFetch = new Set<string>();

        for (const entity of relevantEntities) {
            const stopTimeUpdates = entity.tripUpdate?.stopTimeUpdate || [];
            const hasTargetStop = stopTimeUpdates.some(stop => targetStopIds.has(stop.stopId as string));
            if (hasTargetStop && entity.tripUpdate?.trip.tripId) {
                tripIdsToFetch.add(entity.tripUpdate.trip.tripId);
            }
        }

        const tripHeadsigns = new Map<string, string>();
        if (tripIdsToFetch.size > 0) {
            const placeholders = Array.from(tripIdsToFetch).map(() => '?').join(',');
            const rs = await db.execute({
                // Check both trip_id and trip_short_name
                sql: `SELECT trip_id, trip_short_name, trip_headsign FROM trips WHERE trip_id IN (${placeholders}) OR trip_short_name IN (${placeholders})`,
                // Pass the array twice, once for each IN clause
                args: [...Array.from(tripIdsToFetch), ...Array.from(tripIdsToFetch)]
            });
            for (const row of rs.rows) {
                tripHeadsigns.set(row.trip_id as string, row.trip_headsign as string);
                if (row.trip_short_name) {
                    tripHeadsigns.set(row.trip_short_name as string, row.trip_headsign as string);
                }
            }
        }

        const arrivals = relevantEntities
            .map((entity) => {
                const stopTimeUpdates = entity.tripUpdate?.stopTimeUpdate || [];
                return stopTimeUpdates
                    .filter((stop) => targetStopIds.has(stop.stopId as string))
                    .map(stop => {
                        let time = stop.arrival?.time;
                        if (time && typeof time === 'object' && 'low' in time) {
                            time = (time as any).toNumber ? (time as any).toNumber() : (time as any).low;
                        }

                        // Look up destination in Map
                        const tripId = entity.tripUpdate?.trip.tripId;
                        const headsign = tripId ? tripHeadsigns.get(tripId) : '';

                        return {
                            route: entity.tripUpdate?.trip.routeId,
                            stopId: stop.stopId,
                            label: feedStations.find(s => s.stopId === stop.stopId)?.label,
                            destination: headsign || '',
                            arrivalTime: time
                        };
                    });
            })
            .flat()
            .sort((a, b) => (a.arrivalTime as number) - (b.arrivalTime as number));

        return NextResponse.json({ arrivals });

    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
    }
}