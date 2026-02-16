'use client';

import { useState, useEffect, useMemo } from 'react';
import { X, Search, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn, toTitleCase } from '@/lib/utils';
import type { ComplexInfo, SelectedStop } from '@/lib/types';
import { LineBadge } from './line-badge';

interface StopSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  selectedStops: SelectedStop[]; // Array of {system, stopId}
  onStopsChange: (stops: SelectedStop[]) => void;
  favoriteStops: string[]; // Array of stop IDs
  onToggleFavorite: (stopId: string) => void;
}

export function StopSelector({
  isOpen,
  onClose,
  selectedStops,
  onStopsChange,
  favoriteStops,
  onToggleFavorite,
}: StopSelectorProps) {
  const [complexes, setComplexes] = useState<ComplexInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [systemFilter, setSystemFilter] = useState<'all' | 'subway' | 'bus' | 'mnr'>('all');

  // Fetch complexes from API
  useEffect(() => {
    if (isOpen) {
      const fetchComplexes = async () => {
        setLoading(true);
        try {
          const res = await fetch(`/api/complexes?system=${systemFilter}`);
          if (res.ok) {
            const data = await res.json();
            setComplexes(data.complexes || []);
          }
        } catch (error) {
          console.error('Failed to fetch complexes:', error);
        } finally {
          setLoading(false);
        }
      };

      fetchComplexes();
    }
  }, [isOpen, systemFilter]);

  // Filter complexes by search query
  const filteredComplexes = useMemo(() => {
    if (!searchQuery) return complexes;
    const query = searchQuery.toLowerCase();
    return complexes.filter(
      (complex) =>
        complex.displayName.toLowerCase().includes(query) ||
        complex.complexId.toLowerCase().includes(query) ||
        complex.boroughName.toLowerCase().includes(query) ||
        complex.routes.some(r => r.routeShortName?.toLowerCase().includes(query))
    );
  }, [complexes, searchQuery]);

  // Group complexes: favorites first, then by system
  const groupedComplexes = useMemo(() => {
    // A complex is a favorite if any of its stop IDs are favorited
    const favorites = filteredComplexes.filter((complex) =>
      complex.stopIds.some(stopId => favoriteStops.includes(stopId))
    );
    const nonFavorites = filteredComplexes.filter((complex) =>
      !complex.stopIds.some(stopId => favoriteStops.includes(stopId))
    );

    return {
      favorites,
      subway: nonFavorites.filter((c) => c.system === 'subway'),
      bus: nonFavorites.filter((c) => c.system === 'bus'),
      mnr: nonFavorites.filter((c) => c.system === 'mnr'),
    };
  }, [filteredComplexes, favoriteStops]);

  const handleToggleComplex = (complex: ComplexInfo) => {
    // Check if any stop in this complex is selected
    const isSelected = complex.stopIds.some(stopId =>
      selectedStops.some(s => s.system === complex.system && s.stopId === stopId)
    );

    if (isSelected) {
      // Remove all stops from this complex
      onStopsChange(
        selectedStops.filter(s =>
          !(s.system === complex.system && complex.stopIds.includes(s.stopId))
        )
      );
    } else {
      // Add all directional stops from this complex
      const newStops = complex.stopIds.map(stopId => ({
        system: complex.system,
        stopId
      }));

      // Merge with existing, avoiding duplicates
      const merged = [...selectedStops];
      newStops.forEach((newStop) => {
        if (!merged.some((s) => s.system === newStop.system && s.stopId === newStop.stopId)) {
          merged.push(newStop);
        }
      });

      onStopsChange(merged);
    }
  };

  const handleSelectAll = () => {
    // Add all stops from all filtered complexes
    const newStops = filteredComplexes.flatMap(complex =>
      complex.stopIds.map(stopId => ({ system: complex.system, stopId }))
    );

    // Merge with existing, avoiding duplicates
    const merged = [...selectedStops];
    newStops.forEach((newStop) => {
      if (!merged.some((s) => s.system === newStop.system && s.stopId === newStop.stopId)) {
        merged.push(newStop);
      }
    });
    onStopsChange(merged);
  };

  const handleClearAll = () => {
    onStopsChange([]);
  };

  // Helper to check if a complex is selected (any of its stops are selected)
  const isComplexSelected = (complex: ComplexInfo) => {
    return complex.stopIds.some(stopId =>
      selectedStops.some(s => s.system === complex.system && s.stopId === stopId)
    );
  };

  // Helper to check if a complex is favorited (any of its stops are favorited)
  const isComplexFavorited = (complex: ComplexInfo) => {
    return complex.stopIds.some(stopId => favoriteStops.includes(stopId));
  };

  // Helper to toggle favorite for a complex (favorites the first stop ID)
  const handleToggleComplexFavorite = (complex: ComplexInfo) => {
    // Use the first stop ID as the representative
    const representativeStopId = complex.stopIds[0];
    if (representativeStopId) {
      onToggleFavorite(representativeStopId);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-2xl max-h-[80vh] bg-card border border-border rounded-sm shadow-2xl flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <h2 className="text-xl font-bold">Select Stops</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-accent rounded-sm transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Controls */}
          <div className="px-6 py-4 space-y-3 border-b border-border">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search stops..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            {/* System Filter */}
            <div className="flex gap-2">
              {(['all', 'subway', 'bus', 'mnr'] as const).map((system) => (
                <button
                  key={system}
                  onClick={() => setSystemFilter(system)}
                  className={cn(
                    'px-4 py-2 rounded-sm font-medium text-sm transition-colors',
                    systemFilter === system
                      ? 'bg-foreground text-background'
                      : 'bg-accent text-foreground hover:bg-accent/80'
                  )}
                >
                  {system === 'all' ? 'All' : system === 'mnr' ? 'Metro-North' : system.charAt(0).toUpperCase() + system.slice(1)}
                </button>
              ))}
            </div>

            {/* Bulk Actions */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {selectedStops.length} selected
              </span>
              <div className="flex gap-2">
                <button
                  onClick={handleSelectAll}
                  className="px-3 py-1 text-foreground hover:underline"
                >
                  Select All
                </button>
                <button
                  onClick={handleClearAll}
                  className="px-3 py-1 text-foreground hover:underline"
                >
                  Clear All
                </button>
              </div>
            </div>
          </div>

          {/* Stop List */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-muted-foreground">Loading stops...</div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Favorites */}
                {groupedComplexes.favorites.length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold text-muted-foreground mb-2 flex items-center gap-2">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      Favorites
                    </h3>
                    <div className="space-y-1">
                      {groupedComplexes.favorites.map((complex) => (
                        <ComplexRow
                          key={`${complex.system}-${complex.complexId}`}
                          complex={complex}
                          isSelected={isComplexSelected(complex)}
                          isFavorite={isComplexFavorited(complex)}
                          onToggle={() => handleToggleComplex(complex)}
                          onToggleFavorite={() => handleToggleComplexFavorite(complex)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Subway */}
                {groupedComplexes.subway.length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold text-muted-foreground mb-2">Subway</h3>
                    <div className="space-y-1">
                      {groupedComplexes.subway.map((complex) => (
                        <ComplexRow
                          key={`${complex.system}-${complex.complexId}`}
                          complex={complex}
                          isSelected={isComplexSelected(complex)}
                          isFavorite={isComplexFavorited(complex)}
                          onToggle={() => handleToggleComplex(complex)}
                          onToggleFavorite={() => handleToggleComplexFavorite(complex)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Bus */}
                {groupedComplexes.bus.length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold text-muted-foreground mb-2">Bus</h3>
                    <div className="space-y-1">
                      {groupedComplexes.bus.map((complex) => (
                        <ComplexRow
                          key={`${complex.system}-${complex.complexId}`}
                          complex={complex}
                          isSelected={isComplexSelected(complex)}
                          isFavorite={isComplexFavorited(complex)}
                          onToggle={() => handleToggleComplex(complex)}
                          onToggleFavorite={() => handleToggleComplexFavorite(complex)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Metro-North */}
                {groupedComplexes.mnr.length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold text-muted-foreground mb-2">Metro-North</h3>
                    <div className="space-y-1">
                      {groupedComplexes.mnr.map((complex) => (
                        <ComplexRow
                          key={`${complex.system}-${complex.complexId}`}
                          complex={complex}
                          isSelected={isComplexSelected(complex)}
                          isFavorite={isComplexFavorited(complex)}
                          onToggle={() => handleToggleComplex(complex)}
                          onToggleFavorite={() => handleToggleComplexFavorite(complex)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {filteredComplexes.length === 0 && !loading && (
                  <div className="text-center py-12 text-muted-foreground">
                    No stops found
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-border flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-foreground text-background rounded-sm font-medium hover:opacity-90 transition-opacity"
            >
              Done
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

// Complex Row Component
function ComplexRow({
  complex,
  isSelected,
  isFavorite,
  onToggle,
  onToggleFavorite,
}: {
  complex: ComplexInfo;
  isSelected: boolean;
  isFavorite: boolean;
  onToggle: () => void;
  onToggleFavorite: () => void;
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 p-3 rounded-sm border transition-all cursor-pointer',
        isSelected
          ? 'bg-accent border-foreground/20'
          : 'border-border hover:bg-accent/50'
      )}
      onClick={onToggle}
    >
      {/* Checkbox */}
      <div
        className={cn(
          'w-5 h-5 rounded border-2 flex items-center justify-center shrink-0',
          isSelected ? 'bg-foreground border-foreground' : 'border-muted-foreground'
        )}
      >
        {isSelected && (
          <svg className="w-3 h-3 text-background" fill="currentColor" viewBox="0 0 12 12">
            <path d="M10 3L4.5 8.5L2 6" stroke="currentColor" strokeWidth="2" fill="none" />
          </svg>
        )}
      </div>

      {/* Complex Info */}
      <div className="flex-1 min-w-0">
        <div className="font-medium truncate">{toTitleCase(complex.displayName)}</div>
        {complex.boroughName && (
          <div className="text-xs text-muted-foreground truncate">
            {complex.boroughName}
          </div>
        )}
      </div>

      {/* Route Badges - Only for subway */}
      {complex.system === 'subway' && complex.routes.length > 0 && (
        <div className="flex items-center gap-1 shrink-0 flex-wrap max-w-[200px] justify-end">
          {complex.routes.map((route) => (
            <LineBadge
              key={route.routeId}
              route={route.routeId}
              routeShortName={route.routeShortName || undefined}
              routeLongName={route.routeLongName || undefined}
              routeColor={route.routeColor || undefined}
              routeTextColor={route.routeTextColor || undefined}
              system="subway"
              size="sm"
            />
          ))}
        </div>
      )}

      {/* System Badge - Only for bus/mnr */}
      {(complex.system === 'bus' || complex.system === 'mnr') && (
        <div className="text-xs font-medium px-2 py-1 bg-muted rounded-sm shrink-0">
          {complex.system === 'mnr' ? 'MNR' : 'BUS'}
        </div>
      )}

      {/* Favorite Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleFavorite();
        }}
        className="p-2 hover:bg-background/50 rounded-sm transition-colors shrink-0"
        aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
      >
        <Star
          className={cn(
            'w-4 h-4',
            isFavorite ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'
          )}
        />
      </button>
    </div>
  );
}
