'use client';

import { motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import { RouteBadge } from './route-badge';
import { TrackBadge } from './track-badge';
import type { Arrival, Alert } from '@/lib/types';

interface ArrivalRowProps {
  arrival: Arrival;
  minutes: number;
  alerts: Alert[];
  onAlertClick: (alerts: Alert[]) => void;
  index: number;
  ambientMode: boolean;
}

export function ArrivalRow({
  arrival,
  minutes,
  alerts,
  onAlertClick,
  index,
  ambientMode,
}: ArrivalRowProps) {
  return (
    <motion.li
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ delay: index * 0.05, duration: 0.3, ease: 'easeOut' }}
      className="flex items-center justify-between gap-6 py-4 border-b border-border last:border-0"
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {/* Route Badge */}
        {arrival.route && (
          <RouteBadge
            route={arrival.route}
            routeShortName={arrival.routeShortName}
            routeLongName={arrival.routeLongName}
            routeColor={arrival.routeColor}
            routeTextColor={arrival.routeTextColor}
            system={arrival.system}
          />
        )}

        {/* Track Badge (for MNR) */}
        {arrival.track && <TrackBadge track={arrival.track} />}

        {/* Alert Icon */}
        {alerts.length > 0 && (
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onAlertClick(alerts)}
            className="text-yellow-600 dark:text-yellow-400 hover:text-yellow-700 dark:hover:text-yellow-300 transition-colors p-1.5 border border-border rounded-sm"
            title={`${alerts.length} active alert(s)`}
          >
            <AlertTriangle className="w-4 h-4" />
          </motion.button>
        )}

        {/* Destination */}
        {arrival.destination && (
          <span className="text-sm sm:text-base font-normal text-foreground truncate">
            {arrival.destination}
          </span>
        )}
      </div>

      {/* Time */}
      <div className="text-right flex-shrink-0">
        <motion.span
          key={minutes}
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className={`block font-light tabular-countdown ${
            ambientMode ? 'text-6xl sm:text-7xl' : 'text-5xl sm:text-6xl'
          }`}
        >
          {minutes < 1 ? 'Now' : `${minutes}`}
        </motion.span>
        {!ambientMode && (
          <span className="text-xs text-muted-foreground font-normal mt-1 block">
            {new Date(arrival.arrivalTime * 1000).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        )}
      </div>
    </motion.li>
  );
}
