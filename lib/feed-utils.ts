// Utility functions for GTFS feed processing

import axios from 'axios';
import GtfsRealtimeBindings from 'gtfs-realtime-bindings';
import protobuf from 'protobufjs';
import fs from 'fs';
import path from 'path';
import db from './db';
import { FEEDS, STATIONS } from './stops';
import {
    TransitSystem,
    TripInfo,
    RouteInfo,
    Arrival,
    Alert
} from './types';

/**
 * Fetches raw GTFS-realtime feed data from MTA API
 */
export async function fetchFeedData(feedKey: TransitSystem): Promise<ArrayBuffer> {
    const feedConfig = FEEDS[feedKey];

    if (!feedConfig) {
        throw new Error(`Feed ${feedKey} not configured`);
    }

    const axiosConfig: any = {
        method: 'GET',
        url: feedConfig.url,
        responseType: 'arraybuffer',
    };

    // Add authentication if required
    if ('apiKeyEnv' in feedConfig) {
        const { apiKeyEnv, authType } = feedConfig;
        const apiKey = process.env[apiKeyEnv];

        if (!apiKey) {
            throw new Error(`Missing API key for ${feedKey}: ${apiKeyEnv}`);
        }

        if (authType === 'header') {
            axiosConfig.headers = { 'x-api-key': apiKey };
        } else if (authType === 'query') {
            axiosConfig.params = { key: apiKey };
        }
    }

    const response = await axios(axiosConfig);
    return response.data;
}

/**
 * Decodes GTFS-realtime protobuf data, using custom proto for MNR if available
 */
export async function decodeFeed(
    feedKey: TransitSystem,
    data: ArrayBuffer
): Promise<any> {
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
                return FeedMessage.decode(new Uint8Array(data));
            }
        } catch (e) {
            console.warn("Failed to load local MNR proto, falling back to bindings", e);
        }
    }

    // Fallback to standard bindings
    return GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(
        new Uint8Array(data)
    );
}

/**
 * Maps agency IDs to transit systems for service alerts
 */
const AGENCY_ID_TO_SYSTEM: Record<string, string> = {
    'MTA NYCT': 'subway',
    'MTABC': 'bus',
    'MTASBWY': 'subway',
    'MNR': 'mnr',
    'LI': 'lirr',
};

/**
 * Processes service alerts from feed
 */
export function processServiceAlerts(feed: any): Alert[] {
    return feed.entity
        .filter((entity: any) => entity.alert)
        .map((entity: any) => {
            const alert = entity.alert;
            const systems = new Set<string>();

            if (alert?.informedEntity) {
                for (const informed of alert.informedEntity) {
                    if (informed.agencyId && AGENCY_ID_TO_SYSTEM[informed.agencyId]) {
                        const system = AGENCY_ID_TO_SYSTEM[informed.agencyId];
                        // Heuristic: If agency is NYCT and route looks like a bus route, classify as bus
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
}

/**
 * Fetches trip information from database for enrichment
 */
export async function fetchTripInfos(
    feedKey: TransitSystem,
    tripIds: Set<string>
): Promise<Map<string, TripInfo>> {
    const tripInfos = new Map<string, TripInfo>();

    if (tripIds.size === 0) return tripInfos;

    const placeholders = Array.from(tripIds).map(() => '?').join(',');
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
        args: [feedKey, ...Array.from(tripIds), ...Array.from(tripIds)]
    });

    console.log(`[${feedKey}] Found ${rs.rows.length} matching trips in DB`);

    for (const row of rs.rows) {
        const info: TripInfo = {
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

    return tripInfos;
}

/**
 * Fetches route information from database for enrichment
 */
export async function fetchRouteInfos(
    feedKey: TransitSystem,
    routeIds: Set<string>
): Promise<Map<string, RouteInfo>> {
    const routeInfos = new Map<string, RouteInfo>();

    if (routeIds.size === 0) return routeInfos;

    const placeholders = Array.from(routeIds).map(() => '?').join(',');
    const rs = await db.execute({
        sql: `SELECT route_id, route_short_name, route_long_name, route_color, route_text_color
              FROM routes
              WHERE system = ? AND route_id IN (${placeholders})`,
        args: [feedKey, ...Array.from(routeIds)]
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

    return routeInfos;
}

/**
 * Extracts trip ID based on feed type (MNR uses entity.id)
 */
export function extractTripId(entity: any, feedKey: TransitSystem): string | undefined {
    if (feedKey === 'mnr') {
        return entity.id;
    }
    return entity.tripUpdate?.trip.tripId;
}

/**
 * Normalizes time value from protobuf (handles Long types)
 */
export function normalizeTime(time: any): number | undefined {
    if (!time) return undefined;
    if (typeof time === 'object' && 'low' in time) {
        return time.toNumber ? time.toNumber() : time.low;
    }
    return time;
}

/**
 * Processes arrivals from feed entities with enrichment data
 */
export function processArrivals(
    feed: any,
    feedKey: TransitSystem,
    targetStopIds: Set<string>,
    tripInfos: Map<string, TripInfo>,
    routeInfos: Map<string, RouteInfo>
): Arrival[] {
    const feedStations = STATIONS.filter(s => s.feed === feedKey);
    const relevantEntities = feed.entity.filter((entity: any) => entity.tripUpdate);

    const arrivals = relevantEntities
        .map((entity: any) => {
            const stopTimeUpdates = entity.tripUpdate?.stopTimeUpdate || [];
            return stopTimeUpdates
                .filter((stop: any) => targetStopIds.has(stop.stopId as string))
                .map((stop: any) => {
                    const time = normalizeTime(stop.arrival?.time);
                    const tripId = extractTripId(entity, feedKey);
                    const tripInfo = tripId ? tripInfos.get(tripId) : undefined;
                    const routeId = entity.tripUpdate?.trip.routeId;
                    const routeInfo = routeId ? routeInfos.get(routeId) : undefined;

                    if (tripId && !tripInfo) {
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
                        arrivalTime: time as number
                    };
                });
        })
        .flat()
        .sort((a: Arrival, b: Arrival) => (a.arrivalTime as number) - (b.arrivalTime as number));

    return arrivals;
}

/**
 * Validates feed key
 */
export function isValidFeedKey(feedKey: string): feedKey is TransitSystem {
    return feedKey in FEEDS;
}
