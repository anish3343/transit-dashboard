'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { FavoriteButton } from './favorite-button';
import { ArrivalRow } from './arrival-row';
import type { Arrival, Alert } from '@/lib/types';

interface StationCardProps {
  stationName: string;
  arrivals: Arrival[];
  alerts: Alert[];
  now: number;
  onAlertClick: (alerts: Alert[]) => void;
  isFavorited: boolean;
  onToggleFavorite: () => void;
  ambientMode: boolean;
}

export function StationCard({
  stationName,
  arrivals,
  alerts,
  now,
  onAlertClick,
  isFavorited,
  onToggleFavorite,
  ambientMode,
}: StationCardProps) {
  // Filter and compute alerts for each arrival
  const arrivalsWithMinutes = arrivals.map((arrival) => {
    const minutes = Math.round((arrival.arrivalTime * 1000 - now) / 60000);

    const routeAlerts = alerts.filter((alert) => {
      // Check if alert's system matches arrival's system
      if (!alert.systems || !alert.systems.includes(arrival.system)) {
        return false;
      }

      // Check if alert is currently active
      if (alert.activePeriod && alert.activePeriod.length > 0) {
        const isActive = alert.activePeriod.some((period) => {
          const start = period.start ? Number(period.start) * 1000 : 0;
          const end = period.end ? Number(period.end) * 1000 : Infinity;
          return now >= start && now <= end;
        });
        if (!isActive) return false;
      }

      // Check if alert pertains to this specific trip/route/station
      return alert.informedEntity.some((entity) => {
        if (entity.trip?.tripId && entity.trip.tripId !== arrival.tripId) return false;
        if (entity.routeId && entity.routeId !== arrival.route) return false;
        if (entity.stopId && entity.stopId !== arrival.stopId) return false;
        return true;
      });
    });

    return { arrival, minutes, alerts: routeAlerts };
  });

  // In ambient mode, show only the next arrival per unique route
  const displayArrivals = ambientMode
    ? arrivalsWithMinutes.reduce((acc, item) => {
        const routeKey = item.arrival.route || 'unknown';
        if (!acc.some((a) => (a.arrival.route || 'unknown') === routeKey)) {
          acc.push(item);
        }
        return acc;
      }, [] as typeof arrivalsWithMinutes)
    : arrivalsWithMinutes;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="border border-border rounded-sm p-6 lg:p-8 bg-card"
    >
      {/* Station Header */}
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border">
        <h2 className="text-xl sm:text-2xl font-medium tracking-tight text-foreground flex-1">
          {stationName}
        </h2>

        {/* Favorite button */}
        <FavoriteButton isFavorited={isFavorited} onToggle={onToggleFavorite} size="md" />

        {/* Total alerts badge (hidden in ambient mode) */}
        {!ambientMode && alerts.length > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="px-3 py-1 rounded-sm border border-border bg-background"
          >
            <span className="text-xs font-medium text-yellow-600 dark:text-yellow-400">
              {alerts.length} Alert{alerts.length > 1 ? 's' : ''}
            </span>
          </motion.div>
        )}
      </div>

      {/* Arrivals List */}
      {displayArrivals.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-8 border border-border rounded-sm bg-background"
        >
          <p className="text-muted-foreground italic">No upcoming arrivals</p>
        </motion.div>
      ) : (
        <ul className="space-y-0">
          <AnimatePresence mode="popLayout">
            {displayArrivals.map((item, idx) => (
              <ArrivalRow
                key={`${item.arrival.tripId}-${item.arrival.stopId}-${idx}`}
                arrival={item.arrival}
                minutes={item.minutes}
                alerts={item.alerts}
                onAlertClick={onAlertClick}
                index={idx}
                ambientMode={ambientMode}
              />
            ))}
          </AnimatePresence>
        </ul>
      )}
    </motion.div>
  );
}
