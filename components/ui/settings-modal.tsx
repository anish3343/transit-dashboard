'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronUp, ChevronDown, Star } from 'lucide-react';
import type { Station } from '@/lib/types';

interface SettingsModalProps {
  isOpen: boolean;
  stations: Station[];
  favorites: string[];
  favoriteOrder: string[];
  onFavoritesChange: (favorites: string[]) => void;
  onOrderChange: (order: string[]) => void;
  onClose: () => void;
}

export function SettingsModal({
  isOpen,
  stations,
  favorites,
  favoriteOrder,
  onFavoritesChange,
  onOrderChange,
  onClose,
}: SettingsModalProps) {
  const toggleFavorite = (stopId: string) => {
    if (favorites.includes(stopId)) {
      onFavoritesChange(favorites.filter((id) => id !== stopId));
      onOrderChange(favoriteOrder.filter((id) => id !== stopId));
    } else {
      onFavoritesChange([...favorites, stopId]);
      onOrderChange([...favoriteOrder, stopId]);
    }
  };

  const moveUp = (stopId: string) => {
    const index = favoriteOrder.indexOf(stopId);
    if (index > 0) {
      const newOrder = [...favoriteOrder];
      [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
      onOrderChange(newOrder);
    }
  };

  const moveDown = (stopId: string) => {
    const index = favoriteOrder.indexOf(stopId);
    if (index < favoriteOrder.length - 1 && index >= 0) {
      const newOrder = [...favoriteOrder];
      [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
      onOrderChange(newOrder);
    }
  };

  // Separate favorited and non-favorited stations
  const favoritedStations = stations
    .filter((s) => favorites.includes(s.stopId))
    .sort((a, b) => favoriteOrder.indexOf(a.stopId) - favoriteOrder.indexOf(b.stopId));

  const nonFavoritedStations = stations.filter((s) => !favorites.includes(s.stopId));

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-[1px]"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card border border-border rounded-sm max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col pointer-events-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-border">
                <h3 className="text-2xl font-medium text-foreground">Settings</h3>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Close settings"
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </div>

              {/* Content */}
              <div className="overflow-y-auto p-6 space-y-6">
                {/* Favorited Stations Section */}
                {favoritedStations.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-3">
                      Favorites (Drag to reorder)
                    </h4>
                    <div className="space-y-2">
                      {favoritedStations.map((station, index) => (
                        <motion.div
                          key={station.stopId}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="flex items-center gap-3 p-3 border border-border rounded-sm bg-background"
                        >
                          {/* Order controls */}
                          <div className="flex flex-col gap-0.5">
                            <button
                              onClick={() => moveUp(station.stopId)}
                              disabled={index === 0}
                              className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                              aria-label="Move up"
                            >
                              <ChevronUp className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => moveDown(station.stopId)}
                              disabled={index === favoritedStations.length - 1}
                              className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                              aria-label="Move down"
                            >
                              <ChevronDown className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Station info */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              {station.label}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {station.feed.toUpperCase()}
                            </p>
                          </div>

                          {/* Favorite toggle */}
                          <button
                            onClick={() => toggleFavorite(station.stopId)}
                            className="p-2 text-foreground hover:text-muted-foreground transition-colors"
                            aria-label="Remove from favorites"
                          >
                            <Star className="w-5 h-5" fill="currentColor" />
                          </button>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* All Stations Section */}
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-3">
                    {favoritedStations.length > 0 ? 'Other Stations' : 'All Stations'}
                  </h4>
                  {nonFavoritedStations.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic py-4">
                      All stations are favorited!
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {nonFavoritedStations.map((station, index) => (
                        <motion.div
                          key={station.stopId}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="flex items-center gap-3 p-3 border border-border rounded-sm bg-background"
                        >
                          {/* Station info */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              {station.label}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {station.feed.toUpperCase()}
                            </p>
                          </div>

                          {/* Favorite toggle */}
                          <button
                            onClick={() => toggleFavorite(station.stopId)}
                            className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                            aria-label="Add to favorites"
                          >
                            <Star className="w-5 h-5" fill="none" strokeWidth={2} />
                          </button>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Helper text */}
                <p className="text-xs text-muted-foreground pt-4 border-t border-border">
                  Use the ↑↓ arrows to reorder your favorites. Favorited stations appear first on
                  the dashboard when "Favorites" filter is enabled.
                </p>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
