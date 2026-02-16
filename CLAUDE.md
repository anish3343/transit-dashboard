# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

This is a real-time transit dashboard for NYC transportation (Subway, Bus, Metro-North). It's built with Next.js 16, TypeScript, and uses GTFS (General Transit Feed Specification) data to display live arrival information. The app combines GTFS-realtime protobuf feeds with static GTFS schedule data to show accurate destinations and route information.

## Development Commands

```bash
# Install dependencies (uses pnpm)
pnpm install

# Start development server (http://localhost:3000)
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Run linter
pnpm lint
```

## Environment Variables

Required in `.env.local`:
- `MTA_API_KEY` - MTA API key for subway and Metro-North feeds
- `MTA_BUS_TIME_KEY` - MTA Bus Time API key for bus feeds
- `TURSO_DATABASE_URL` (optional) - For remote Turso database; defaults to local `transit.db` file
- `TURSO_AUTH_TOKEN` (optional) - Auth token for Turso database

## Architecture

### Data Flow

The application follows this data flow:

1. **GTFS Static Data** ([app/api/gtfs/update/route.ts](app/api/gtfs/update/route.ts))
   - Downloads ZIP files from MTA containing static schedule data (stops, trips, routes)
   - Parses CSV files and loads into SQLite database
   - Runs on app startup and every hour
   - Handles three feeds: subway (supplemented), bus (Manhattan), and MNR

2. **GTFS Realtime Data** ([app/api/[feed]/route.ts](app/api/[feed]/route.ts))
   - Fetches protobuf feeds from MTA APIs every 30 seconds
   - Subway uses **8 separate feeds** organized by line groups (ACE, BDFM, G, JZ, NQRW, L, 1234567, SIR)
   - Frontend queries all relevant subway feeds in parallel when displaying subway stops
   - Decodes using `gtfs-realtime-bindings` (standard feeds) or `protobufjs` (MNR extended proto)
   - Joins realtime trip updates with static data from database to get headsigns and route colors
   - Returns enriched arrival data to frontend

3. **Frontend** ([app/page.tsx](app/page.tsx))
   - Client-side React component polling APIs every 30 seconds
   - Displays arrivals grouped by station with countdown timers
   - Shows service alerts when applicable
   - Dark mode support with system theme detection

### Database Schema

SQLite database ([lib/db.ts](lib/db.ts)) with three tables:

- `stops` - Station information (system, stop_id, stop_name)
- `trips` - Trip metadata including headsigns (system, trip_id, route_id, trip_headsign, trip_short_name, direction_id)
- `routes` - Route information including colors (system, route_id, route_short_name, route_long_name, route_color, route_text_color)

Uses `@libsql/client` which supports both local SQLite files and remote Turso databases.

### Multi-System Support

The codebase handles three transit systems (subway, bus, mnr) with system-specific logic:

**Subway:**
- **Multiple Feeds**: MTA provides 8 separate realtime feeds organized by line groups:
  - `subway-ace` - A, C, E lines (+ S Rockaway shuttle)
  - `subway-bdfm` - B, D, F, M lines (+ S Franklin shuttle)
  - `subway-g` - G line
  - `subway-jz` - J, Z lines
  - `subway-nqrw` - N, Q, R, W lines
  - `subway-l` - L line
  - `subway-1234567` - 1, 2, 3, 4, 5, 6, 7 lines (+ S 42nd St shuttle)
  - `subway-sir` - Staten Island Railway
- **Frontend Behavior**: When displaying subway stops, frontend queries ALL 8 feeds in parallel ([app/page.tsx:151-178](app/page.tsx#L151-L178))
  - This is necessary because a single stop may be served by lines from multiple feeds
  - Results are combined and deduplicated client-side
- **Database Queries**: All subway feeds use `system='subway'` in database queries for static data
- **Trip ID Matching**: Realtime feed uses format `052150_6..N` but static schedule has `A2023..._052150_6..N`
  - Solution: Extract suffix as `trip_short_name` for matching ([app/api/gtfs/update/route.ts:58-65](app/api/gtfs/update/route.ts#L58-L65))

**Bus:**
- Authentication via query parameter (`?key=...`)
- Uses standard GTFS-realtime format

**Metro-North (MNR):**
- Uses custom protobuf extensions (`gtfs-realtime-MTARR.proto`) to get track numbers
- Trip ID is in `entity.id` not `entity.tripUpdate.trip.tripId`
- Falls back to `trip_id` as `trip_short_name` if missing ([app/api/gtfs/update/route.ts:67-70](app/api/gtfs/update/route.ts#L67-L70))
- Protobuf files stored in [proto/](proto/) directory

### Service Alerts

Special feed (`service_alerts`) provides system-wide alerts:
- Maps agency IDs to systems (e.g., `MTA NYCT` → subway, `MTABC` → bus)
- Uses heuristic to classify bus routes (pattern: `^[A-Z]{1,2}\d+`)
- Frontend filters alerts by active period, route, stop, and trip ([app/page.tsx:139-162](app/page.tsx#L139-L162))

### Configuration

**Station Configuration** ([lib/stops.ts](lib/stops.ts)):
- `STATIONS` array defines which stops to monitor
- Each entry has: stopId, label, feed type
- To add a new stop: add entry to `STATIONS` array with the GTFS stop_id

**Feed URLs** ([lib/stops.ts](lib/stops.ts)):
- `GTFS_STATIC_URLS` - Static schedule ZIP downloads
- `GTFS_REALTIME_PROTOBUF_URLS` - Proto file definitions
- `FEEDS` - Realtime API endpoints with auth configuration

**Route Colors** ([colors.json](colors.json)):
- Currently informational; route colors come from GTFS routes.txt
- Contains official MTA color specifications

## Key Implementation Details

### Trip Matching Logic

Critical for showing correct destinations. The realtime feed provides trip_id, but format varies by system:
- Query both `trip_id` and `trip_short_name` columns ([app/api/[feed]/route.ts:173](app/api/[feed]/route.ts#L173))
- For MNR, use `entity.id` as the trip identifier ([app/api/[feed]/route.ts:139-142](app/api/[feed]/route.ts#L139-L142))
- If no match found, warning is logged ([app/api/[feed]/route.ts:236-241](app/api/[feed]/route.ts#L236-L241))

### Protobuf Handling

MNR requires custom proto definitions to access extended fields like track numbers:
- Proto files in [proto/](proto/) directory include imports
- Custom resolve path handles proto imports ([app/api/[feed]/route.ts:55-60](app/api/[feed]/route.ts#L55-L60))
- Falls back to standard bindings if custom proto fails ([app/api/[feed]/route.ts:66-68](app/api/[feed]/route.ts#L66-L68))

### Database Updates

GTFS static data is bulk-loaded using `INSERT OR REPLACE`:
- Batches of 50 rows to avoid SQL limits ([app/api/gtfs/update/route.ts:33](app/api/gtfs/update/route.ts#L33))
- Uses parameterized queries to prevent SQL injection
- Three feeds updated sequentially: subway, MNR, bus

## Common Patterns

- **API Routes**: All return `NextResponse.json()` with error handling
- **Database Queries**: Use parameterized queries with `db.execute()` or `db.batch()`
- **Feed Configuration**: Centralized in `lib/stops.ts` with system-specific auth
- **Frontend State**: Multiple `useEffect` hooks with cleanup for intervals
- **Time Handling**: Arrivals in Unix timestamps, converted to countdown timers client-side
