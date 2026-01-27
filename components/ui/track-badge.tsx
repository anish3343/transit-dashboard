'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface TrackBadgeProps {
  track: string;
  className?: string;
}

export function TrackBadge({ track, className }: TrackBadgeProps) {
  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={cn(
        "neomorph-inset px-3 py-1 inline-flex items-center justify-center min-w-[3rem]",
        className
      )}
    >
      <span className="text-xs font-bold text-foreground">
        Trk {track}
      </span>
    </motion.div>
  );
}
