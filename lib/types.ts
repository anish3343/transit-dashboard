// Type definitions for GTFS data structures

export type SubwayFeed = 'subway-ace' | 'subway-bdfm' | 'subway-g' | 'subway-jz' | 'subway-nqrw' | 'subway-l' | 'subway-1234567' | 'subway-sir';
export type TransitSystem = SubwayFeed | 'bus' | 'mnr' | 'service_alerts';

export interface FeedConfig {
    url: string;
    apiKeyEnv?: string;
    authType?: 'header' | 'query';
}

export interface Station {
    stopId: string;
    label: string;
    feed: TransitSystem;
}

export interface TripInfo {
    headsign: string;
    routeShortName: string;
    routeLongName: string;
    routeColor: string;
    routeTextColor: string;
}

export interface RouteInfo {
    shortName: string;
    longName: string;
    color: string;
    textColor: string;
}

export interface Arrival {
    system: string;
    tripId?: string;
    route?: string;
    routeShortName?: string;
    routeLongName?: string;
    routeColor?: string;
    routeTextColor?: string;
    track?: string;
    stopId: string;
    label?: string;
    destination: string;
    arrivalTime: number;
    borough?: string;
    boroughName?: string;
    complexId?: string;
    displayName?: string;
}

export interface Alert {
    id: string;
    systems: string[];
    activePeriod: Array<{
        start?: number;
        end?: number;
    }>;
    informedEntity: Array<{
        agencyId?: string;
        routeId?: string;
        stopId?: string;
        trip?: {
            tripId?: string;
        };
    }>;
    headerText?: {
        translation: Array<{
            text: string;
            language: string;
        }>;
    };
    descriptionText?: {
        translation: Array<{
            text: string;
            language: string;
        }>;
    };
}

export interface ApiErrorResponse {
    error: string;
    details?: string;
}

export interface ApiSuccessResponse<T> {
    success: true;
    data: T;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

// Favorites and settings types

export interface FavoritesState {
  favorites: string[];
  order: string[];
}

export interface DashboardSettings {
  ambientMode: boolean;
  showFavoritesOnly: boolean;
}

export interface StopInfo {
  system: string;
  stopId: string;
  stopName: string;
  routes: Array<{
    routeId: string;
    routeShortName: string | null;
    routeLongName: string | null;
    routeColor: string | null;
    routeTextColor: string | null;
  }>;
}

export interface SelectedStop {
  system: string;
  stopId: string;
}

export interface ComplexRouteInfo {
  routeId: string;
  routeShortName: string | null;
  routeLongName: string | null;
  routeColor: string | null;
  routeTextColor: string | null;
}

export interface ComplexInfo {
  complexId: string;
  displayName: string;
  borough: string;
  boroughName: string;
  system: string;
  routes: ComplexRouteInfo[];
  stopIds: string[]; // All directional stop IDs (e.g., ["101N", "101S"])
  parentStopIds: string[]; // Parent stop IDs (e.g., ["101"])
}
