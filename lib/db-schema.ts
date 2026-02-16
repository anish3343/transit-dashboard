// Centralized database schema definitions

export const DB_SCHEMA = {
    stops: `CREATE TABLE IF NOT EXISTS stops (
        system TEXT,
        stop_id TEXT,
        stop_name TEXT,
        stop_lat REAL,
        stop_lon REAL,
        location_type INTEGER,
        parent_station TEXT,
        PRIMARY KEY (system, stop_id)
    )`,
    trips: `CREATE TABLE IF NOT EXISTS trips (
        system TEXT,
        trip_id TEXT,
        route_id TEXT,
        service_id TEXT,
        trip_headsign TEXT,
        trip_short_name TEXT,
        direction_id INTEGER,
        shape_id TEXT,
        PRIMARY KEY (system, trip_id)
    )`,
    routes: `CREATE TABLE IF NOT EXISTS routes (
        system TEXT,
        route_id TEXT,
        agency_id TEXT,
        route_short_name TEXT,
        route_long_name TEXT,
        route_desc TEXT,
        route_type INTEGER,
        route_url TEXT,
        route_color TEXT,
        route_text_color TEXT,
        route_sort_order INTEGER,
        PRIMARY KEY (system, route_id)
    )`,
    station_complexes: `CREATE TABLE IF NOT EXISTS station_complexes (
        complex_id TEXT PRIMARY KEY,
        is_complex INTEGER,
        number_of_stations INTEGER,
        stop_name TEXT,
        display_name TEXT,
        gtfs_stop_ids TEXT,
        borough TEXT,
        cbd INTEGER,
        daytime_routes TEXT,
        structure_type TEXT,
        latitude REAL,
        longitude REAL,
        ada INTEGER
    )`
};

export const getSchemaStatements = () => Object.values(DB_SCHEMA);

export const getDropStatements = () => [
    'DROP TABLE IF EXISTS stops',
    'DROP TABLE IF EXISTS trips',
    'DROP TABLE IF EXISTS routes',
    'DROP TABLE IF EXISTS station_complexes'
];
