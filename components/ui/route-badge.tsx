'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface RouteBadgeProps {
  route: string;
  routeShortName?: string;
  routeLongName?: string;
  routeColor?: string;
  routeTextColor?: string;
  system: string;
  className?: string;
}

export function RouteBadge({
  route,
  routeShortName,
  routeLongName,
  routeColor,
  routeTextColor,
  system,
  className
}: RouteBadgeProps) {
  const displayText = routeShortName || routeLongName || route;
  const bgColor = routeColor ? `#${routeColor}` : '#808183';
  const textColor = routeTextColor ? `#${routeTextColor}` : '#FFFFFF';

  // Circular for subway, rounded pills for bus/MNR
  const isSubway = system === 'subway';
  const isCircular = isSubway && displayText?.length <= 2;

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "inline-flex items-center justify-center font-bold cursor-help",
        isCircular
          ? "w-8 h-8 rounded-full"
          : "px-3 py-1 rounded-full min-w-[3rem]",
        className
      )}
      style={{
        backgroundColor: bgColor,
        color: textColor,
      }}
      title={routeLongName || route}
    >
      <span className={cn(
        "text-center select-none",
        isCircular ? "text-sm leading-none" : "text-xs"
      )}>
        {displayText}
      </span>
    </motion.div>
  );
}
