'use client';

import { useRef, useMemo } from 'react';
import { DepartureCard } from './departure-card';
import { LineBadge } from './line-badge';
import { AlertTriangle } from 'lucide-react';
import { cn, sortRoutes, toTitleCase } from '@/lib/utils';
import type { Arrival, Alert } from '@/lib/types';

interface NewStationCardProps {
  stationName: string;
  arrivals: Arrival[];
  alerts: Alert[];
  now: number;
  onAlertClick?: (alerts: Alert[]) => void;
  className?: string;
}

export function NewStationCard({
  stationName,
  arrivals,
  alerts,
  now,
  onAlertClick,
  className,
}: NewStationCardProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Get unique routes serving this station
  const uniqueRoutes = useMemo(() => {
    const routeMap = new Map<string, Arrival>();
    arrivals.forEach((arrival) => {
      const key = arrival.route || 'unknown';
      if (!routeMap.has(key)) {
        routeMap.set(key, arrival);
      }
    });
    const routes = Array.from(routeMap.values());

    // Sort routes by subway order (ACEBDFMGJZLNQRWS1234567) or alphabetically
    const system = arrivals[0]?.system || 'unknown';
    return sortRoutes(
      routes.map((r) => ({ routeId: r.route || '', routeShortName: r.routeShortName })),
      system
    ).map((sorted) => routes.find((r) => r.route === sorted.routeId)!);
  }, [arrivals]);

  // Filter arrivals for future departures only
  const futureArrivals = useMemo(() => {
    return arrivals.filter((a) => a.arrivalTime * 1000 > now);
  }, [arrivals, now]);

  const hasAlerts = alerts.length > 0;

  return (
    <div
      className={cn(
        'flex flex-col bg-card border border-border overflow-hidden',
        'rounded-sm shadow-sm h-full min-h-[350px]',
        className
      )}
    >
      {/* Station Header - MTA Board Style */}
      <div className="bg-station-board-bg text-station-board-text px-5 py-4 flex items-center gap-4">
        {/* Station Name with ellipsis */}
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-bold tracking-tight truncate">
            {toTitleCase(stationName)}
          </h2>
        </div>

        {/* Alert Icon */}
        {hasAlerts && onAlertClick && (
          <button
            onClick={() => onAlertClick(alerts)}
            className="shrink-0 p-1 hover:bg-white/10 rounded transition-colors"
            aria-label={`${alerts.length} service alert${alerts.length > 1 ? 's' : ''}`}
          >
            <AlertTriangle className="w-5 h-5 text-yellow-400" />
          </button>
        )}

        {/* Line Badges */}
        <div className="flex gap-1.5 shrink-0">
          {uniqueRoutes.map((arrival, idx) => (
            <LineBadge
              key={`${arrival.route}-${idx}`}
              route={arrival.route || ''}
              routeShortName={arrival.routeShortName}
              routeLongName={arrival.routeLongName}
              routeColor={arrival.routeColor}
              routeTextColor={arrival.routeTextColor}
              system={arrival.system}
              size="md"
            />
          ))}
        </div>
      </div>

      {/* Departures - Horizontal Scroll */}
      <div className="p-4 flex-1 flex flex-col">
        {futureArrivals.length === 0 ? (
          <div className="flex items-center justify-center py-12 text-center flex-1">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">No upcoming departures</p>
              <p className="text-xs text-muted-foreground">Check back later</p>
            </div>
          </div>
        ) : (
          <div className="relative">
            {/* Horizontal Scroll Container */}
            <div
              ref={scrollContainerRef}
              className="flex gap-3 overflow-x-auto horizontal-scroll pb-2"
            >
              {futureArrivals.map((arrival, idx) => (
                <div
                  key={`${arrival.tripId}-${arrival.stopId}-${idx}`}
                  style={{
                    position: idx === 0 ? 'sticky' : 'relative',
                    left: idx === 0 ? 0 : 'auto',
                    zIndex: idx === 0 ? 10 : 1,
                  }}
                >
                  <DepartureCard arrival={arrival} now={now} isFirst={idx === 0} />
                </div>
              ))}
            </div>

            {/* Scroll Indicators */}
            {futureArrivals.length > 3 && (
              <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-card to-transparent pointer-events-none" />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
