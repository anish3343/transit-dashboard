import { NextResponse } from 'next/server';
import { STATIONS } from '../../../lib/stops';
import {
    isValidFeedKey,
    fetchFeedData,
    decodeFeed,
    processServiceAlerts,
    fetchTripInfos,
    fetchRouteInfos,
    processArrivals,
    extractTripId
} from '../../../lib/feed-utils';

export async function GET(
    _request: Request,
    props: { params: Promise<{ feed: string }> }
) {
    try {
        const params = await props.params;
        const feedKey = params.feed;

        // Validate feed key
        if (!isValidFeedKey(feedKey)) {
            return NextResponse.json(
                { error: `Feed '${feedKey}' not configured` },
                { status: 404 }
            );
        }

        // Fetch and decode feed data
        const rawData = await fetchFeedData(feedKey);
        const feed = await decodeFeed(feedKey, rawData);

        // Handle Service Alerts Feed
        if (feedKey === 'service_alerts') {
            const alerts = processServiceAlerts(feed);
            return NextResponse.json({ alerts });
        }

        // Filter for stations belonging to this feed
        const feedStations = STATIONS.filter(s => s.feed === feedKey);
        const targetStopIds = new Set(feedStations.map(s => s.stopId));

        // Identify trips and routes that are relevant to our target stops
        const relevantEntities = feed.entity.filter((entity: any) => entity.tripUpdate);
        const tripIdsToFetch = new Set<string>();
        const routeIdsToFetch = new Set<string>();

        for (const entity of relevantEntities) {
            const stopTimeUpdates = entity.tripUpdate?.stopTimeUpdate || [];
            const hasTargetStop = stopTimeUpdates.some(
                (stop: any) => targetStopIds.has(stop.stopId as string)
            );

            if (hasTargetStop) {
                const tripId = extractTripId(entity, feedKey);
                if (tripId) {
                    tripIdsToFetch.add(tripId);
                }
                if (entity.tripUpdate?.trip.routeId) {
                    routeIdsToFetch.add(entity.tripUpdate.trip.routeId);
                }
            }
        }

        // Fetch enrichment data from database
        const [tripInfos, routeInfos] = await Promise.all([
            fetchTripInfos(feedKey, tripIdsToFetch),
            fetchRouteInfos(feedKey, routeIdsToFetch)
        ]);

        // Process arrivals with enrichment data
        const arrivals = processArrivals(
            feed,
            feedKey,
            targetStopIds,
            tripInfos,
            routeInfos
        );

        return NextResponse.json({ arrivals });

    } catch (error) {
        console.error(`[feed-api] Error processing feed:`, error);
        return NextResponse.json(
            {
                error: 'Failed to fetch feed data',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}