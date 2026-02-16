import type { SubwayFeed } from './types';

export const GTFS_STATIC_URLS = {
    subway: 'https://rrgtfsfeeds.s3.amazonaws.com/gtfs_subway.zip',
    subway_supplemented: 'https://rrgtfsfeeds.s3.amazonaws.com/gtfs_supplemented.zip',
    mnr: 'https://rrgtfsfeeds.s3.amazonaws.com/gtfsmnr.zip',
    bus_manhattan: 'https://rrgtfsfeeds.s3.amazonaws.com/gtfs_m.zip',
};

export const GTFS_REALTIME_PROTOBUF_URLS = {
    gtfs_realtime: 'https://raw.githubusercontent.com/google/transit/master/gtfs-realtime/proto/gtfs-realtime.proto',
    subway: 'https://raw.githubusercontent.com/OneBusAway/onebusaway-gtfs-realtime-api/master/src/main/proto/com/google/transit/realtime/gtfs-realtime-NYCT.proto',
    mnr: 'https://raw.githubusercontent.com/OneBusAway/onebusaway-gtfs-realtime-api/master/src/main/proto/com/google/transit/realtime/gtfs-realtime-MTARR.proto',
    service_alerts: 'https://raw.githubusercontent.com/OneBusAway/onebusaway-gtfs-realtime-api/master/src/main/proto/com/google/transit/realtime/gtfs-realtime-service-status.proto'
}

export const FEEDS = {
    // Subway feeds by line group
    'subway-ace': {
        url: 'https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-ace',
    },
    'subway-bdfm': {
        url: 'https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-bdfm',
    },
    'subway-g': {
        url: 'https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-g',
    },
    'subway-jz': {
        url: 'https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-jz',
    },
    'subway-nqrw': {
        url: 'https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-nqrw',
    },
    'subway-l': {
        url: 'https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-l',
    },
    'subway-1234567': {
        url: 'https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs',
    },
    'subway-sir': {
        url: 'https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-si',
    },
    bus: {
        url: 'https://gtfsrt.prod.obanyc.com/tripUpdates',
        apiKeyEnv: 'MTA_BUS_TIME_KEY',
        authType: 'query',
    },
    mnr: {
        url: 'https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/mnr%2Fgtfs-mnr',
    },
    service_alerts: {
        url: 'https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/camsys%2Fall-alerts',
    }
};

// List of all subway feed keys
export const SUBWAY_FEEDS: SubwayFeed[] = [
    'subway-ace',
    'subway-bdfm',
    'subway-g',
    'subway-jz',
    'subway-nqrw',
    'subway-l',
    'subway-1234567',
    'subway-sir',
];

// Removed: STATIONS array is no longer needed
// Stop names are now fetched dynamically from the database