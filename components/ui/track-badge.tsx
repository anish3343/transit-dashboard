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
        "border border-border rounded-sm px-3 py-1 inline-flex items-center justify-center min-w-[3rem] bg-background",
        className
      )}
    >
      <span className="text-xs font-medium text-foreground">
        Trk {track}
      </span>
    </motion.div>
  );
}
