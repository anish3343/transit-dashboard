'use client';

import { cn } from '@/lib/utils';

interface LineBadgeProps {
  route: string;
  routeShortName?: string;
  routeLongName?: string;
  routeColor?: string;
  routeTextColor?: string;
  system: string;
  size?: 'sm' | 'md' | 'lg'; // sm for departure cards, md/lg for station headers
  className?: string;
}

export function LineBadge({
  route,
  routeShortName,
  routeLongName,
  routeColor,
  routeTextColor,
  system,
  size = 'md',
  className,
}: LineBadgeProps) {
  const displayText = routeShortName || routeLongName || route;
  const bgColor = routeColor ? `#${routeColor}` : '#808183';
  const textColor = routeTextColor ? `#${routeTextColor}` : '#FFFFFF';

  // Determine if this should be circular (subway single letters/numbers)
  const isSubway = system === 'subway';
  const isCircular = isSubway && displayText?.length <= 2;

  // Size variants - matching MTA signage
  // MTA SVG reference: 74.9x74.9 viewbox, 57.126 diameter circle (~76% ratio)
  // For circular badges, font size is ~55% of badge diameter
  const badgeSizes = {
    sm: { size: 28, className: 'w-7 h-7' },
    md: { size: 36, className: 'w-9 h-9' },
    lg: { size: 44, className: 'w-11 h-11' },
  };

  const sizeClasses = {
    sm: isCircular ? badgeSizes.sm.className : 'px-2 py-0.5 text-xs min-w-[2rem]',
    md: isCircular ? badgeSizes.md.className : 'px-2.5 py-1 text-sm min-w-[2.5rem]',
    lg: isCircular ? badgeSizes.lg.className : 'px-3 py-1.5 text-base min-w-[3rem]',
  };

  // Calculate font size as percentage of badge diameter for circular badges
  const fontSize = isCircular ? badgeSizes[size].size * 0.65 : undefined;

  return (
    <div
      className={cn(
        'inline-flex items-center justify-center font-extrabold shrink-0',
        'shadow-[0_1px_2px_rgba(0,0,0,0.25)] border border-black/10',
        isCircular ? 'rounded-full' : 'rounded-sm', // Square corners for pills
        sizeClasses[size],
        className
      )}
      style={{
        backgroundColor: bgColor,
        color: textColor,
      }}
      title={routeLongName || route}
      role="img"
      aria-label={`${displayText} line`}
    >
      <span
        className="leading-none select-none tabular-nums"
        style={fontSize ? { fontSize: `${fontSize}px` } : undefined}
      >
        {displayText}
      </span>
    </div>
  );
}
