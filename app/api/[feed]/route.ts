import { NextResponse } from 'next/server';
import GtfsRealtimeBindings from 'gtfs-realtime-bindings';
import axios from 'axios';
import { STATIONS, FEEDS } from '../../../lib/stops';
import db from '../../../lib/db';
import fs from 'fs';
import path from 'path';
import protobuf from 'protobufjs';

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

        let feed: any;

        // Try to use local protos for MNR to get track info
        if (feedKey === 'mnr') {
            try {
                const protoDir = path.join(process.cwd(), 'proto');
                const mnrProto = path.join(protoDir, 'gtfs-realtime-MTARR.proto');
                if (fs.existsSync(mnrProto)) {
                    const root = new protobuf.Root();

                    // Resolve imports to the flattened proto directory
                    root.resolvePath = (origin, target) => {
                        if (target.endsWith('gtfs-realtime.proto')) {
                            return path.join(protoDir, 'gtfs-realtime.proto');
                        }
                        return protobuf.util.path.resolve(origin, target);
                    };

                    await root.load(mnrProto, { keepCase: false });
                    const FeedMessage = root.lookupType("transit_realtime.FeedMessage");
                    feed = FeedMessage.decode(new Uint8Array(response.data));
                }
            } catch (e) {
                console.warn("Failed to load local MNR proto, falling back to bindings", e);
            }
        }

        if (!feed) {
            feed = GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(
                new Uint8Array(response.data)
            );
        }

        // Handle Service Alerts Feed
        if (feedKey === 'service_alerts') {

            const alerts = feed.entity
                .filter((entity: { alert: any; }) => entity.alert)
                .map((entity: { alert: any; id: any; }) => {
                    const alert = entity.alert;

                    const AGENCY_ID_TO_SYSTEM: Record<string, string> = {
                        'MTA NYCT': 'subway', // Default to subway, but check route for bus patterns
                        'MTABC': 'bus',
                        'MTASBWY': 'subway',
                        'MNR': 'mnr',
                        'LI': 'lirr',
                    };

                    const systems = new Set<string>();
                    if (alert?.informedEntity) {
                        for (const informed of alert.informedEntity) {
                            if (informed.agencyId && AGENCY_ID_TO_SYSTEM[informed.agencyId]) {
                                const system = AGENCY_ID_TO_SYSTEM[informed.agencyId];
                                // Heuristic: If agency is NYCT and route looks like a bus route (e.g., M15, Bx12), classify as bus.
                                if (system === 'subway' && informed.routeId && /^[A-Z]{1,2}\d+/.test(informed.routeId)) {
                                    systems.add('bus');
                                } else {
                                    systems.add(system);
                                }
                            }
                        }
                    }

                    const activePeriod = alert?.activePeriod?.map((p: any) => ({
                        start: p.start?.toNumber ? p.start.toNumber() : p.start,
                        end: p.end?.toNumber ? p.end.toNumber() : p.end,
                    })) || [];
                    return {
                        id: entity.id,
                        systems: Array.from(systems),
                        activePeriod,
                        informedEntity: alert?.informedEntity || [],
                        headerText: alert?.headerText,
                        descriptionText: alert?.descriptionText,
                    };
                });
            return NextResponse.json({ alerts });
        }

        // Filter for stations belonging to this feed
        const feedStations = STATIONS.filter(s => s.feed === feedKey);
        const targetStopIds = new Set(feedStations.map(s => s.stopId));

        // Identify trips that are relevant to our target stops so we can fetch headsigns in bulk
        const relevantEntities = feed.entity.filter((entity: { tripUpdate: any; }) => entity.tripUpdate);
        const tripIdsToFetch = new Set<string>();
        const routeIdsToFetch = new Set<string>();

        for (const entity of relevantEntities) {
            const stopTimeUpdates = entity.tripUpdate?.stopTimeUpdate || [];
            const hasTargetStop = stopTimeUpdates.some((stop: { stopId: string; }) => targetStopIds.has(stop.stopId as string));
            if (hasTargetStop) {
                if (entity.tripUpdate?.trip.tripId) {
                    // mnr uses non-standard field for Train Number; use entity.id
                    if (feedKey === 'mnr') {
                        tripIdsToFetch.add(entity.id);
                    } else {
                        tripIdsToFetch.add(entity.tripUpdate.trip.tripId);
                    }
                }
                if (entity.tripUpdate?.trip.routeId) {
                    routeIdsToFetch.add(entity.tripUpdate.trip.routeId);
                }
            }
        }

        const tripInfos = new Map<string, {
            headsign: string;
            routeShortName: string;
            routeLongName: string;
            routeColor: string;
            routeTextColor: string;
        }>();

        if (tripIdsToFetch.size > 0) {
            const placeholders = Array.from(tripIdsToFetch).map(() => '?').join(',');
            const rs = await db.execute({
                sql: `
                    SELECT
                        t.trip_id,
                        t.trip_short_name,
                        t.trip_headsign,
                        r.route_short_name,
                        r.route_long_name,
                        r.route_color,
                        r.route_text_color
                    FROM trips t
                    LEFT JOIN routes r ON t.route_id = r.route_id AND t.system = r.system
                    WHERE t.system = ? AND (t.trip_id IN (${placeholders}) OR t.trip_short_name IN (${placeholders}))
                `,
                args: [feedKey, ...Array.from(tripIdsToFetch), ...Array.from(tripIdsToFetch)]
            });

            console.log(`[${feedKey}] Found ${rs.rows.length} matching trips in DB`);

            for (const row of rs.rows) {
                const info = {
                    headsign: row.trip_headsign as string,
                    routeShortName: row.route_short_name as string,
                    routeLongName: row.route_long_name as string,
                    routeColor: row.route_color as string,
                    routeTextColor: row.route_text_color as string,
                };
                tripInfos.set(row.trip_id as string, info);
                if (row.trip_short_name) {
                    tripInfos.set(row.trip_short_name as string, info);
                }
            }
        }

        const routeInfos = new Map<string, {
            shortName: string;
            longName: string;
            color: string;
            textColor: string;
        }>();

        if (routeIdsToFetch.size > 0) {
            const placeholders = Array.from(routeIdsToFetch).map(() => '?').join(',');
            const rs = await db.execute({
                sql: `SELECT route_id, route_short_name, route_long_name, route_color, route_text_color FROM routes WHERE system = ? AND route_id IN (${placeholders})`,
                args: [feedKey, ...Array.from(routeIdsToFetch)]
            });
            console.log(`[${feedKey}] Found ${rs.rows.length} matching routes in DB`);
            for (const row of rs.rows) {
                routeInfos.set(row.route_id as string, {
                    shortName: row.route_short_name as string,
                    longName: row.route_long_name as string,
                    color: row.route_color as string,
                    textColor: row.route_text_color as string,
                });
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
                        const tripId = (feedKey === 'mnr') ? entity.id : entity.tripUpdate?.trip.tripId;
                        const tripInfo = tripId ? tripInfos.get(tripId) : undefined;
                        const routeId = entity.tripUpdate?.trip.routeId;
                        const routeInfo = routeId ? routeInfos.get(routeId) : undefined;

                        if (tripId && !tripInfo) {
                            // This log is helpful for debugging trips that don't match.
                            // For MNR, it might be that the trip is not in the static schedule (e.g., extra train).
                            // For Subway, it could be a trip ID format mismatch we haven't accounted for.
                            console.warn(`[${feedKey}] No trip info found for ID: ${tripId}`);
                        }

                        return {
                            system: feedKey,
                            tripId,
                            route: routeId,
                            routeShortName: tripInfo?.routeShortName || routeInfo?.shortName,
                            routeLongName: tripInfo?.routeLongName || routeInfo?.longName,
                            routeColor: tripInfo?.routeColor || routeInfo?.color,
                            routeTextColor: tripInfo?.routeTextColor || routeInfo?.textColor,
                            track: (stop as any).mtaRailroadStopTimeUpdate?.track,
                            stopId: stop.stopId,
                            label: feedStations.find(s => s.stopId === stop.stopId)?.label,
                            destination: tripInfo?.headsign || '',
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