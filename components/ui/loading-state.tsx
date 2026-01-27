'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export function LoadingSkeleton({ className }: { className?: string }) {
  return (
    <motion.div
      className={cn("neomorph-inset overflow-hidden relative", className)}
      animate={{
        opacity: [0.5, 0.8, 0.5],
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-muted to-transparent animate-shimmer" />
    </motion.div>
  );
}

export function StationLoadingState() {
  return (
    <div className="neomorph p-6">
      <LoadingSkeleton className="h-7 w-3/4 mb-6" />
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <LoadingSkeleton className="h-8 w-8 rounded-full" />
              <LoadingSkeleton className="h-5 w-32" />
            </div>
            <LoadingSkeleton className="h-6 w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}
