// Centralized database schema definitions

export const DB_SCHEMA = {
    stops: `CREATE TABLE IF NOT EXISTS stops (
        system TEXT,
        stop_id TEXT,
        stop_name TEXT,
        PRIMARY KEY (system, stop_id)
    )`,
    trips: `CREATE TABLE IF NOT EXISTS trips (
        system TEXT,
        trip_id TEXT,
        route_id TEXT,
        trip_headsign TEXT,
        trip_short_name TEXT,
        direction_id INTEGER,
        PRIMARY KEY (system, trip_id)
    )`,
    routes: `CREATE TABLE IF NOT EXISTS routes (
        system TEXT,
        route_id TEXT,
        route_short_name TEXT,
        route_long_name TEXT,
        route_color TEXT,
        route_text_color TEXT,
        PRIMARY KEY (system, route_id)
    )`
};

export const getSchemaStatements = () => Object.values(DB_SCHEMA);

export const getDropStatements = () => [
    'DROP TABLE IF EXISTS stops',
    'DROP TABLE IF EXISTS trips',
    'DROP TABLE IF EXISTS routes'
];
