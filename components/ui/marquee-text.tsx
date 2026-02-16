'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface MarqueeTextProps {
  text: string;
  className?: string;
  speed?: number; // pixels per second, default 50
}

// Global timestamp to sync all marquees
let globalMarqueeStart = Date.now();

export function MarqueeText({ text, className, speed = 50 }: MarqueeTextProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [needsMarquee, setNeedsMarquee] = useState(false);
  const [duration, setDuration] = useState(10);

  useEffect(() => {
    const checkOverflow = () => {
      if (!containerRef.current || !contentRef.current) return;

      // Force a reflow to get accurate measurements
      const containerWidth = containerRef.current.getBoundingClientRect().width;
      const contentWidth = contentRef.current.scrollWidth;

      const shouldMarquee = contentWidth > containerWidth + 5; // 5px threshold
      setNeedsMarquee(shouldMarquee);

      if (shouldMarquee) {
        // Calculate duration based on content width and speed
        const distance = contentWidth + 32; // 32px gap between duplicates
        const durationInSeconds = distance / speed;
        setDuration(Math.max(durationInSeconds, 5)); // Minimum 5 seconds
      }
    };

    // Check immediately and after a short delay to ensure rendering is complete
    const timeoutId = setTimeout(checkOverflow, 100);
    checkOverflow();

    window.addEventListener('resize', checkOverflow);
    return () => {
      window.removeEventListener('resize', checkOverflow);
      clearTimeout(timeoutId);
    };
  }, [text, speed]);

  // Calculate animation delay to sync with global start time
  const animationDelay = needsMarquee && duration > 0
    ? -((Date.now() - globalMarqueeStart) / 1000) % duration
    : 0;

  if (!needsMarquee) {
    return (
      <div ref={containerRef} className={cn('overflow-hidden', className)}>
        <div ref={contentRef} className="whitespace-nowrap">
          {text}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn('overflow-hidden relative', className)}
      aria-label={text}
    >
      <div
        ref={contentRef}
        className="inline-flex whitespace-nowrap gap-8"
        style={{
          animation: `marquee ${duration}s linear infinite`,
          animationDelay: `${animationDelay}s`,
          willChange: 'transform',
        }}
      >
        <span className="inline-block">{text}</span>
        <span className="inline-block" aria-hidden="true">{text}</span>
      </div>
    </div>
  );
}

// Reset sync point - useful when navigating or mounting new content
export function resetMarqueeSync() {
  globalMarqueeStart = Date.now();
}
