/**
 * localStorage utilities for transit dashboard preferences
 * Provides type-safe storage operations with validation
 */

import type { SelectedStop } from './types';

const STORAGE_KEYS = {
  FAVORITES: 'transit-dashboard-favorites',
  FAVORITE_ORDER: 'transit-dashboard-favorite-order',
  AMBIENT_MODE: 'transit-dashboard-ambient-mode',
  SHOW_FAVORITES_ONLY: 'transit-dashboard-show-favorites-only',
  THEME: 'transit-dashboard-theme',
  SELECTED_STOPS: 'transit-dashboard-selected-stops',
  COMPACT_MODE: 'transit-dashboard-compact-mode',
  STOP_ORDER: 'transit-dashboard-stop-order',
} as const;

/**
 * Get favorited station IDs from localStorage
 * Returns empty array if not found or parsing fails
 */
export function getFavorites(): string[] {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem(STORAGE_KEYS.FAVORITES);
    if (!stored) return [];

    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.warn('Failed to parse favorites from localStorage', e);
    return [];
  }
}

/**
 * Save favorited station IDs to localStorage
 */
export function setFavorites(favorites: string[]): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(favorites));
  } catch (e) {
    console.warn('Failed to save favorites to localStorage (quota may be exceeded)', e);
  }
}

/**
 * Get favorite ordering from localStorage
 * Returns empty array if not found or parsing fails
 */
export function getFavoriteOrder(): string[] {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem(STORAGE_KEYS.FAVORITE_ORDER);
    if (!stored) return [];

    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.warn('Failed to parse favorite order from localStorage', e);
    return [];
  }
}

/**
 * Save favorite ordering to localStorage
 */
export function setFavoriteOrder(order: string[]): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(STORAGE_KEYS.FAVORITE_ORDER, JSON.stringify(order));
  } catch (e) {
    console.warn('Failed to save favorite order to localStorage (quota may be exceeded)', e);
  }
}

/**
 * Get ambient mode preference from localStorage
 * Returns false if not found or parsing fails
 */
export function getAmbientMode(): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const stored = localStorage.getItem(STORAGE_KEYS.AMBIENT_MODE);
    if (!stored) return false;

    return stored === 'true';
  } catch (e) {
    console.warn('Failed to parse ambient mode from localStorage', e);
    return false;
  }
}

/**
 * Save ambient mode preference to localStorage
 */
export function setAmbientMode(enabled: boolean): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(STORAGE_KEYS.AMBIENT_MODE, enabled.toString());
  } catch (e) {
    console.warn('Failed to save ambient mode to localStorage (quota may be exceeded)', e);
  }
}

/**
 * Get show favorites only preference from localStorage
 * Returns false if not found or parsing fails
 */
export function getShowFavoritesOnly(): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const stored = localStorage.getItem(STORAGE_KEYS.SHOW_FAVORITES_ONLY);
    if (!stored) return false;

    return stored === 'true';
  } catch (e) {
    console.warn('Failed to parse show favorites only from localStorage', e);
    return false;
  }
}

/**
 * Save show favorites only preference to localStorage
 */
export function setShowFavoritesOnly(enabled: boolean): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(STORAGE_KEYS.SHOW_FAVORITES_ONLY, enabled.toString());
  } catch (e) {
    console.warn('Failed to save show favorites only to localStorage (quota may be exceeded)', e);
  }
}

/**
 * Validate favorites against available station IDs
 * Filters out any stopIds that don't exist in the provided valid set
 */
export function validateFavorites(favorites: string[], validStopIds: string[]): string[] {
  return favorites.filter(id => validStopIds.includes(id));
}

/**
 * Ensure favorite order only contains items that are favorited
 * Removes any stopIds from order that aren't in favorites
 */
export function validateFavoriteOrder(order: string[], favorites: string[]): string[] {
  return order.filter(id => favorites.includes(id));
}

/**
 * Get selected stops from localStorage
 * Returns empty array if not found or parsing fails
 */
export function getSelectedStops(): SelectedStop[] {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem(STORAGE_KEYS.SELECTED_STOPS);
    if (!stored) return [];

    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.warn('Failed to parse selected stops from localStorage', e);
    return [];
  }
}

/**
 * Save selected stops to localStorage
 */
export function setSelectedStops(stops: SelectedStop[]): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(STORAGE_KEYS.SELECTED_STOPS, JSON.stringify(stops));
  } catch (e) {
    console.warn('Failed to save selected stops to localStorage (quota may be exceeded)', e);
  }
}


/**
 * Get compact mode preference from localStorage
 */
export function getCompactMode(): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const stored = localStorage.getItem(STORAGE_KEYS.COMPACT_MODE);
    if (!stored) return false;

    return stored === 'true';
  } catch (e) {
    console.warn('Failed to parse compact mode from localStorage', e);
    return false;
  }
}

/**
 * Save compact mode preference to localStorage
 */
export function setCompactMode(enabled: boolean): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(STORAGE_KEYS.COMPACT_MODE, enabled.toString());
  } catch (e) {
    console.warn('Failed to save compact mode to localStorage (quota may be exceeded)', e);
  }
}

/**
 * Get custom stop order from localStorage
 * Returns empty array if not found or parsing fails
 */
export function getStopOrder(): string[] {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem(STORAGE_KEYS.STOP_ORDER);
    if (!stored) return [];

    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.warn('Failed to parse stop order from localStorage', e);
    return [];
  }
}

/**
 * Save custom stop order to localStorage
 */
export function setStopOrder(order: string[]): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(STORAGE_KEYS.STOP_ORDER, JSON.stringify(order));
  } catch (e) {
    console.warn('Failed to save stop order to localStorage (quota may be exceeded)', e);
  }
}
