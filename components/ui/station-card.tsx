'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { MapPin } from 'lucide-react';
import { ArrivalRow } from './arrival-row';
import type { Arrival, Alert } from '@/lib/types';

interface StationCardProps {
  stationName: string;
  arrivals: Arrival[];
  alerts: Alert[];
  now: number;
  onAlertClick: (alerts: Alert[]) => void;
}

export function StationCard({
  stationName,
  arrivals,
  alerts,
  now,
  onAlertClick
}: StationCardProps) {
  // Filter and compute alerts for each arrival
  const arrivalsWithMinutes = arrivals.map(arrival => {
    const minutes = Math.round((arrival.arrivalTime * 1000 - now) / 60000);

    const routeAlerts = alerts.filter(alert => {
      // Check if alert's system matches arrival's system
      if (!alert.systems || !alert.systems.includes(arrival.system)) {
        return false;
      }

      // Check if alert is currently active
      if (alert.activePeriod && alert.activePeriod.length > 0) {
        const isActive = alert.activePeriod.some(period => {
          const start = period.start ? Number(period.start) * 1000 : 0;
          const end = period.end ? Number(period.end) * 1000 : Infinity;
          return now >= start && now <= end;
        });
        if (!isActive) return false;
      }

      // Check if alert pertains to this specific trip/route/station
      return alert.informedEntity.some(entity => {
        if (entity.trip?.tripId && entity.trip.tripId !== arrival.tripId) return false;
        if (entity.routeId && entity.routeId !== arrival.route) return false;
        if (entity.stopId && entity.stopId !== arrival.stopId) return false;
        return true;
      });
    });

    return { arrival, minutes, alerts: routeAlerts };
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="neomorph p-6 hover:shadow-2xl transition-shadow"
    >
      {/* Station Header */}
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border">
        <div className="neomorph-inset p-2 rounded-full">
          <MapPin className="w-5 h-5 text-primary" />
        </div>
        <h2 className="text-xl font-bold text-foreground flex-1">
          {stationName}
        </h2>
        {/* Total alerts badge */}
        {alerts.length > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="neomorph-inset px-3 py-1 rounded-full"
          >
            <span className="text-xs font-bold text-yellow-600 dark:text-yellow-400">
              {alerts.length} Alert{alerts.length > 1 ? 's' : ''}
            </span>
          </motion.div>
        )}
      </div>

      {/* Arrivals List */}
      {arrivalsWithMinutes.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-8 neomorph-inset rounded-2xl"
        >
          <p className="text-muted-foreground italic">
            No upcoming arrivals
          </p>
        </motion.div>
      ) : (
        <ul className="space-y-3">
          <AnimatePresence mode="popLayout">
            {arrivalsWithMinutes.map((item, idx) => (
              <ArrivalRow
                key={`${item.arrival.tripId}-${item.arrival.stopId}-${idx}`}
                arrival={item.arrival}
                minutes={item.minutes}
                alerts={item.alerts}
                onAlertClick={onAlertClick}
                index={idx}
              />
            ))}
          </AnimatePresence>
        </ul>
      )}
    </motion.div>
  );
}
