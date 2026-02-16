'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RefreshIndicatorProps {
  isRefreshing: boolean;
  lastUpdate?: Date;
  className?: string;
}

export function RefreshIndicator({ isRefreshing, lastUpdate, className }: RefreshIndicatorProps) {
  return (
    <div className={cn('flex items-center gap-2 text-sm text-muted-foreground', className)}>
      <AnimatePresence mode="wait">
        {isRefreshing ? (
          <motion.div
            key="refreshing"
            initial={{ opacity: 0, rotate: 0 }}
            animate={{ opacity: 1, rotate: 360 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
          >
            <RefreshCw className="w-4 h-4 animate-spin" />
          </motion.div>
        ) : (
          <motion.div
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <RefreshCw className="w-4 h-4" />
          </motion.div>
        )}
      </AnimatePresence>

      {lastUpdate && !isRefreshing && (
        <span className="text-xs">
          Updated {lastUpdate.toLocaleTimeString()}
        </span>
      )}
    </div>
  );
}
