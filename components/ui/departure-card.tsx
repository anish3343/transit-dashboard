'use client';

import { LineBadge } from './line-badge';
import { cn, toTitleCase } from '@/lib/utils';
import type { Arrival } from '@/lib/types';

interface DepartureCardProps {
  arrival: Arrival;
  now: number;
  isFirst?: boolean; // For styling the first (pinned) card differently
  className?: string;
}

export function DepartureCard({ arrival, now, isFirst = false, className }: DepartureCardProps) {
  const minutesUntil = Math.round((arrival.arrivalTime * 1000 - now) / 60000);
  const arrivalDate = new Date(arrival.arrivalTime * 1000);

  // <15min: show big countdown + small time
  // >=15min: show just the time
  const showCountdown = minutesUntil < 15;

  // Format time as "8:45 PM"
  const timeString = arrivalDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });

  // Format countdown as "5 min"
  const countdownString = minutesUntil <= 0 ? 'Now' : `${minutesUntil} min`;

  // Determine if countdown is imminent (<3 minutes)
  const isImminent = minutesUntil < 3;

  return (
    <div
      className={cn(
        'flex flex-col p-3 bg-card border border-border rounded-sm shrink-0',
        'transition-all duration-200',
        isFirst && 'ring-2 ring-foreground/20 shadow-md',
        className
      )}
      style={{ width: '140px', height: '220px' }} // Fixed dimensions for uniform appearance
    >
      {/* Line Badge */}
      <div className="flex items-center justify-center">
        <LineBadge
          route={arrival.route || ''}
          routeShortName={arrival.routeShortName}
          routeLongName={arrival.routeLongName}
          routeColor={arrival.routeColor}
          routeTextColor={arrival.routeTextColor}
          system={arrival.system}
          size="sm"
        />
      </div>

      {/* Time Display - Centered in remaining space */}
      <div className="flex-1 flex flex-col items-center justify-center">
        {showCountdown ? (
          <>
            {/* Big Countdown */}
            <div
              className={cn(
                'text-4xl font-black tabular-nums leading-none tracking-tight',
                isImminent && 'text-countdown-highlight'
              )}
            >
              {minutesUntil <= 0 ? 'Now' : minutesUntil}
            </div>
            {minutesUntil > 0 && (
              <div
                className={cn(
                  'text-xs font-bold mt-1 uppercase tracking-wide',
                  isImminent ? 'text-countdown-highlight' : 'text-muted-foreground'
                )}
              >
                min
              </div>
            )}
            {/* Small Time Below */}
            <div className="text-xs text-muted-foreground mt-1.5 tabular-nums font-medium">
              {timeString}
            </div>
          </>
        ) : (
          <>
            {/* Just Time */}
            <div className="text-2xl font-black tabular-nums leading-none tracking-tight">
              {timeString}
            </div>
            <div className="text-xs text-muted-foreground mt-1.5 font-medium">
              {minutesUntil} min
            </div>
          </>
        )}
      </div>

      {/* Headsign - Pinned to bottom, exactly 3 lines with track on 3rd line if present */}
      <div className="border-t border-border pt-2 mt-auto">
        {arrival.track ? (
          <>
            {/* Headsign (2 lines when track present) */}
            <div
              className="text-xs font-bold text-center text-foreground tracking-tight leading-tight"
              style={{
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                lineHeight: '1.3',
                height: 'calc(1.3em * 2)', // Exactly 2 lines
              }}
            >
              {toTitleCase(arrival.destination)}
            </div>
            {/* Track on 3rd line */}
            <div
              className="text-xs font-bold text-center text-muted-foreground uppercase tracking-wide mt-0.5"
              style={{
                lineHeight: '1.3',
                height: 'calc(1.3em * 1)', // Exactly 1 line
              }}
            >
              Track {arrival.track}
            </div>
          </>
        ) : (
          /* Headsign (3 lines when no track) */
          <div
            className="text-xs font-bold text-center text-foreground tracking-tight leading-tight"
            style={{
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              lineHeight: '1.3',
              height: 'calc(1.3em * 3)', // Exactly 3 lines
            }}
          >
            {toTitleCase(arrival.destination)}
          </div>
        )}
      </div>
    </div>
  );
}
