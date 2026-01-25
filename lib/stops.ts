export const GTFS_STATIC_URLS = {
    subway: 'https://rrgtfsfeeds.s3.amazonaws.com/gtfs_subway.zip',
    subway_supplemented: 'https://rrgtfsfeeds.s3.amazonaws.com/gtfs_supplemented.zip',
    mnr: 'https://rrgtfsfeeds.s3.amazonaws.com/gtfsmnr.zip',
    bus_manhattan: 'https://rrgtfsfeeds.s3.amazonaws.com/gtfs_m.zip',
};

export const FEEDS = {
    subway: {
        url: 'https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs',
    },
    bus: {
        url: 'https://gtfsrt.prod.obanyc.com/tripUpdates',
        apiKeyEnv: 'MTA_BUS_TIME_KEY',
        authType: 'query',
    },
    mnr: {
        url: 'https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/mnr%2Fgtfs-mnr',
    },
};

export const STATIONS = [
    { stopId: '632N', label: '33 St (North)', feed: 'subway' },
    { stopId: '632S', label: '33 St (South)', feed: 'subway' },
    { stopId: '402677', label: '3 Av/E 37 St', feed: 'bus' },
    { stopId: '405530', label: 'Lexington Av/E 37 St', feed: 'bus' },
    { stopId: '1', label: 'Grand Central', feed: 'mnr' }, // stop code 0NY
    { stopId: '128', label: 'Darien', feed: 'mnr' }, // stop code 2DA
];