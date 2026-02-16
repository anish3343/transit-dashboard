import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * MTA subway line order for proper badge sorting
 * Order: A C E B D F M G J Z L N Q R W S 1 2 3 4 5 6 7
 */
const SUBWAY_LINE_ORDER = 'ACEBDFMGJZLNQRWS1234567';

/**
 * Sort routes by MTA subway order for subway lines, alphabetically for others
 * @param routes Array of route objects with routeId or routeShortName
 * @param system Transit system ('subway', 'bus', 'mnr')
 * @returns Sorted array of routes
 */
export function sortRoutes<T extends { routeId: string; routeShortName?: string | null }>(
  routes: T[],
  system: string
): T[] {
  if (system === 'subway') {
    return [...routes].sort((a, b) => {
      const aRoute = (a.routeShortName || a.routeId).trim();
      const bRoute = (b.routeShortName || b.routeId).trim();

      const aIndex = SUBWAY_LINE_ORDER.indexOf(aRoute);
      const bIndex = SUBWAY_LINE_ORDER.indexOf(bRoute);

      // If both routes are in the order, sort by position
      if (aIndex !== -1 && bIndex !== -1) {
        return aIndex - bIndex;
      }

      // If only one is in the order, prioritize it
      if (aIndex !== -1) return -1;
      if (bIndex !== -1) return 1;

      // Otherwise, sort alphabetically
      return aRoute.localeCompare(bRoute);
    });
  }

  // For bus and MNR, sort alphabetically
  return [...routes].sort((a, b) => {
    const aRoute = (a.routeShortName || a.routeId).trim();
    const bRoute = (b.routeShortName || b.routeId).trim();
    return aRoute.localeCompare(bRoute);
  });
}

/**
 * Convert a string to Title Case
 * Handles special cases like "at", "and", "the", etc.
 * Treats all non-alphanumeric characters as word breaks
 */
export function toTitleCase(str: string): string {
  const smallWords = /^(a|an|and|as|at|but|by|for|if|in|nor|of|on|or|so|the|to|up|via|vs)$/i;

  // Split on non-alphanumeric characters while preserving them
  const parts = str.toLowerCase().split(/([^a-zA-Z0-9]+)/);

  // Get only the word parts (filter out separators) to track first/last
  const wordIndices: number[] = [];
  parts.forEach((part, idx) => {
    if (part && /[a-zA-Z0-9]/.test(part)) {
      wordIndices.push(idx);
    }
  });

  return parts
    .map((part, idx) => {
      // If it's a separator (non-alphanumeric), return as-is
      if (!part || !/[a-zA-Z0-9]/.test(part)) {
        return part;
      }

      const wordPosition = wordIndices.indexOf(idx);
      const isFirstWord = wordPosition === 0;
      const isLastWord = wordPosition === wordIndices.length - 1;

      // Always capitalize first and last word
      if (isFirstWord || isLastWord) {
        return part.charAt(0).toUpperCase() + part.slice(1);
      }

      // Don't capitalize small words
      if (smallWords.test(part)) {
        return part;
      }

      // Capitalize everything else
      return part.charAt(0).toUpperCase() + part.slice(1);
    })
    .join('');
}
