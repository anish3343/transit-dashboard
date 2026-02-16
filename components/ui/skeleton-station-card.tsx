'use client';

import { cn } from '@/lib/utils';

export function SkeletonStationCard({ className }: { className?: string }) {
  return (
    <div className={cn('flex flex-col bg-card border border-border rounded-sm shadow-sm animate-pulse', className)}>
      {/* Header Skeleton */}
      <div className="bg-station-board-bg px-4 py-3 flex items-center gap-3">
        <div className="flex-1 h-6 bg-white/20 rounded" />
        <div className="flex gap-1.5">
          <div className="w-8 h-8 bg-white/20 rounded-full" />
          <div className="w-8 h-8 bg-white/20 rounded-full" />
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="p-4">
        <div className="flex gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="w-[140px] shrink-0 p-3 border border-border rounded-sm space-y-2">
              <div className="h-6 bg-muted rounded mx-auto w-12" />
              <div className="h-12 bg-muted rounded" />
              <div className="h-4 bg-muted rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function SkeletonGrid() {
  return (
    <div className="h-full grid gap-4 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 auto-rows-min">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <SkeletonStationCard key={i} />
      ))}
    </div>
  );
}
