'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Settings, Sun, Moon, Monitor, Maximize2, Minimize2, Edit3 } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { NewStationCard } from '@/components/ui/new-station-card';
import { StopSelector } from '@/components/ui/stop-selector';
import { AlertModal } from '@/components/ui/alert-modal';
import { SkeletonGrid } from '@/components/ui/skeleton-station-card';
import { RefreshIndicator } from '@/components/ui/refresh-indicator';
import { SortableStationWrapper } from '@/components/ui/sortable-station-wrapper';
import type { Arrival, Alert, SelectedStop } from '@/lib/types';
import {
  getSelectedStops,
  setSelectedStops as saveSelectedStops,
  getFavorites,
  setFavorites as saveFavorites,
  getCompactMode,
  setCompactMode as saveCompactMode,
  getStopOrder,
  setStopOrder as saveStopOrder,
} from '@/lib/storage';
import { cn } from '@/lib/utils';

export default function Dashboard() {
  // Data state
  const [arrivals, setArrivals] = useState<Arrival[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [now, setNow] = useState<number>(Date.now());

  // UI state
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
  const [selectedStops, setSelectedStops] = useState<SelectedStop[]>([]);
  const [favoriteStops, setFavoriteStops] = useState<string[]>([]);
  const [stopOrder, setStopOrder] = useState<string[]>([]);
  const [editMode, setEditMode] = useState(false);
  const [compactMode, setCompactMode] = useState(false);
  const [stopSelectorOpen, setStopSelectorOpen] = useState(false);
  const [selectedAlerts, setSelectedAlerts] = useState<Alert[] | null>(null);

  // Load preferences from localStorage
  useEffect(() => {
    const loadedStops = getSelectedStops();
    const loadedFavorites = getFavorites();
    const loadedOrder = getStopOrder();
    const loadedCompact = getCompactMode();

    setSelectedStops(loadedStops);
    setFavoriteStops(loadedFavorites);
    setStopOrder(loadedOrder);
    setCompactMode(loadedCompact);

    // Load theme
    const savedTheme = localStorage.getItem('transit-dashboard-theme') as 'light' | 'dark' | 'system' | null;
    if (savedTheme) {
      setTheme(savedTheme);
    }

    // If no stops selected, open selector
    if (loadedStops.length === 0) {
      setStopSelectorOpen(true);
    }
  }, []);

  // Persist preferences
  useEffect(() => {
    saveSelectedStops(selectedStops);
  }, [selectedStops]);

  useEffect(() => {
    saveFavorites(favoriteStops);
  }, [favoriteStops]);

  useEffect(() => {
    saveStopOrder(stopOrder);
  }, [stopOrder]);

  useEffect(() => {
    saveCompactMode(compactMode);
  }, [compactMode]);

  useEffect(() => {
    localStorage.setItem('transit-dashboard-theme', theme);
  }, [theme]);

  // Handle theme switching
  useEffect(() => {
    const root = document.documentElement;
    const applyTheme = (t: 'light' | 'dark') => {
      if (t === 'dark') {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      applyTheme(mediaQuery.matches ? 'dark' : 'light');
      const listener = (e: MediaQueryListEvent) => applyTheme(e.matches ? 'dark' : 'light');
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    } else {
      applyTheme(theme);
    }
  }, [theme]);

  // Update GTFS static data on mount and hourly
  useEffect(() => {
    const updateGtfs = () => fetch('/api/gtfs/update').catch(console.error);
    updateGtfs();
    const interval = setInterval(updateGtfs, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Update "now" every 30 seconds for countdown updates
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);

  // Fetch arrivals data
  useEffect(() => {
    if (selectedStops.length === 0) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      if (!loading) setIsRefreshing(true);

      try {
        // Define all subway feeds
        const SUBWAY_FEEDS = [
          'subway-ace',
          'subway-bdfm',
          'subway-g',
          'subway-jz',
          'subway-nqrw',
          'subway-l',
          'subway-1234567',
          'subway-sir',
        ];

        // Group selected stops by system
        const stopsBySystem: Record<string, string[]> = {
          subway: [],
          bus: [],
          mnr: [],
        };

        selectedStops.forEach((stop) => {
          if (stop.system in stopsBySystem) {
            stopsBySystem[stop.system].push(stop.stopId);
          }
        });

        // Create fetch promises
        const promises: Promise<any[]>[] = [];

        // For subway stops, query all subway feeds
        if (stopsBySystem.subway.length > 0) {
          const stopsParam = stopsBySystem.subway.join(',');
          SUBWAY_FEEDS.forEach((feed) => {
            promises.push(
              fetch(`/api/${feed}?stops=${encodeURIComponent(stopsParam)}`)
                .then((res) => (res.ok ? res.json() : { arrivals: [] }))
                .then((json) => json.arrivals || [])
                .catch(() => [])
            );
          });
        }

        // For bus and mnr, query single feed
        if (stopsBySystem.bus.length > 0) {
          const stopsParam = stopsBySystem.bus.join(',');
          promises.push(
            fetch(`/api/bus?stops=${encodeURIComponent(stopsParam)}`)
              .then((res) => (res.ok ? res.json() : { arrivals: [] }))
              .then((json) => json.arrivals || [])
              .catch(() => [])
          );
        }

        if (stopsBySystem.mnr.length > 0) {
          const stopsParam = stopsBySystem.mnr.join(',');
          promises.push(
            fetch(`/api/mnr?stops=${encodeURIComponent(stopsParam)}`)
              .then((res) => (res.ok ? res.json() : { arrivals: [] }))
              .then((json) => json.arrivals || [])
              .catch(() => [])
          );
        }

        const results = await Promise.all(promises);
        const allArrivals = results.flat();

        setArrivals(allArrivals);
        setLastUpdate(new Date());
      } catch (error) {
        console.error('Failed to fetch arrivals:', error);
      } finally {
        setLoading(false);
        setIsRefreshing(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [selectedStops]);

  // Fetch service alerts
  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const res = await fetch('/api/service_alerts');
        if (res.ok) {
          const json = await res.json();
          setAlerts(json.alerts || []);
        }
      } catch (e) {
        console.error('Failed to fetch alerts', e);
      }
    };

    fetchAlerts();
    const interval = setInterval(fetchAlerts, 60000);
    return () => clearInterval(interval);
  }, []);

  // Group arrivals by stop (using system:stopId composite key)
  const stopGroups = useMemo(() => {
    const groups = new Map<string, { system: string; stopId: string; stopName: string; arrivals: Arrival[] }>();

    arrivals.forEach((arrival) => {
      const compositeKey = `${arrival.system}:${arrival.stopId}`;
      if (!groups.has(compositeKey)) {
        groups.set(compositeKey, {
          system: arrival.system,
          stopId: arrival.stopId,
          stopName: arrival.label || arrival.stopId,
          arrivals: [],
        });
      }
      groups.get(compositeKey)!.arrivals.push(arrival);
    });

    return Array.from(groups.entries()).map(([compositeKey, data]) => ({
      compositeKey,
      system: data.system,
      stopId: data.stopId,
      stopName: data.stopName,
      arrivals: data.arrivals.sort((a, b) => a.arrivalTime - b.arrivalTime),
    }));
  }, [arrivals]);

  // Order stops based on custom order from drag-and-drop
  const sortedStops = useMemo(() => {
    const stops = [...stopGroups];

    // If we have a custom order, use it (order uses composite keys)
    if (stopOrder.length > 0) {
      return stops.sort((a, b) => {
        const aIndex = stopOrder.indexOf(a.compositeKey);
        const bIndex = stopOrder.indexOf(b.compositeKey);

        // If both are in the order, sort by position
        if (aIndex !== -1 && bIndex !== -1) {
          return aIndex - bIndex;
        }

        // If only one is in the order, prioritize it
        if (aIndex !== -1) return -1;
        if (bIndex !== -1) return 1;

        // Otherwise, sort alphabetically
        return a.stopName.localeCompare(b.stopName);
      });
    }

    // Default to alphabetical if no custom order
    return stops.sort((a, b) => a.stopName.localeCompare(b.stopName));
  }, [stopGroups, stopOrder]);

  const handleToggleFavorite = (stopId: string) => {
    setFavoriteStops((prev) =>
      prev.includes(stopId) ? prev.filter((id) => id !== stopId) : [...prev, stopId]
    );
  };

  const cycleTheme = () => {
    setTheme((prev) => {
      if (prev === 'light') return 'dark';
      if (prev === 'dark') return 'system';
      return 'light';
    });
  };

  // Drag-and-drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = sortedStops.findIndex((stop) => stop.compositeKey === active.id);
      const newIndex = sortedStops.findIndex((stop) => stop.compositeKey === over.id);

      const newOrder = arrayMove(
        sortedStops.map((s) => s.compositeKey),
        oldIndex,
        newIndex
      );

      setStopOrder(newOrder);
    }
  };

  // Update stop order when new stops are added
  useEffect(() => {
    if (sortedStops.length > 0) {
      const currentCompositeKeys = sortedStops.map((s) => s.compositeKey);

      // If no order exists, initialize it
      if (stopOrder.length === 0) {
        setStopOrder(currentCompositeKeys);
      } else {
        // Add new stops to the end of the order if they're not already there
        const newStops = currentCompositeKeys.filter(key => !stopOrder.includes(key));
        if (newStops.length > 0) {
          setStopOrder([...stopOrder, ...newStops]);
        }

        // Remove stops from order that are no longer selected
        const validOrder = stopOrder.filter(key => currentCompositeKeys.includes(key));
        if (validOrder.length !== stopOrder.length) {
          setStopOrder(validOrder);
        }
      }
    }
  }, [sortedStops]);

  const ThemeIcon = theme === 'light' ? Sun : theme === 'dark' ? Moon : Monitor;
  const CompactIcon = compactMode ? Minimize2 : Maximize2;

  return (
    <main className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            {/* Title */}
            <div>
              <h1 className="text-2xl font-bold tracking-tight">NYC Transit Dashboard</h1>
              <p className="text-sm text-muted-foreground">Real-time arrivals</p>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2">
              {/* Refresh Indicator */}
              <RefreshIndicator isRefreshing={isRefreshing} lastUpdate={lastUpdate || undefined} />

              {/* Edit Mode */}
              <button
                onClick={() => setEditMode(!editMode)}
                className={cn(
                  'p-2 rounded-sm transition-colors',
                  editMode
                    ? 'bg-foreground text-background hover:opacity-90'
                    : 'hover:bg-accent'
                )}
                title={editMode ? 'Exit edit mode' : 'Enter edit mode to reorder stations'}
                aria-label={editMode ? 'Exit edit mode' : 'Enter edit mode'}
              >
                <Edit3 className="w-5 h-5" />
              </button>

              {/* Compact Mode */}
              <button
                onClick={() => setCompactMode(!compactMode)}
                className="p-2 hover:bg-accent rounded-sm transition-colors"
                title={compactMode ? 'Expand view' : 'Compact view'}
                aria-label={compactMode ? 'Expand view' : 'Compact view'}
              >
                <CompactIcon className="w-5 h-5" />
              </button>

              {/* Theme */}
              <button
                onClick={cycleTheme}
                className="p-2 hover:bg-accent rounded-sm transition-colors"
                title={`Theme: ${theme}`}
                aria-label="Change theme"
              >
                <ThemeIcon className="w-5 h-5" />
              </button>

              {/* Add Stops */}
              <button
                onClick={() => setStopSelectorOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-foreground text-background rounded-sm font-medium hover:opacity-90 transition-opacity"
                title="Select and manage transit stops to track"
                aria-label="Manage stops"
              >
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">Manage Stops</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 container mx-auto px-4 py-6">
        {loading ? (
          <SkeletonGrid />
        ) : selectedStops.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">Welcome to NYC Transit Dashboard</h2>
              <p className="text-muted-foreground max-w-md">
                Select stops to track real-time arrivals for subway, bus, and Metro-North trains.
              </p>
              <button
                onClick={() => setStopSelectorOpen(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-foreground text-background rounded-sm font-medium hover:opacity-90 transition-opacity"
                title="Select stops to begin tracking arrivals"
              >
                <Plus className="w-5 h-5" />
                Add Stops
              </button>
            </div>
          </motion.div>
        ) : sortedStops.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <div className="space-y-4">
              <h2 className="text-xl font-bold">No arrival data available</h2>
              <p className="text-muted-foreground">
                Departure information will appear when trains are scheduled.
              </p>
            </div>
          </motion.div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={sortedStops.map((s) => s.compositeKey)}
              strategy={verticalListSortingStrategy}
            >
              <motion.div
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: { opacity: 0 },
                  visible: {
                    opacity: 1,
                    transition: { staggerChildren: 0.05 },
                  },
                }}
                className={cn(
                  'grid gap-4 auto-rows-min',
                  compactMode
                    ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                    : 'grid-cols-1 lg:grid-cols-2 xl:grid-cols-3'
                )}
              >
                <AnimatePresence mode="popLayout">
                  {sortedStops.map((stop) => {
                    const stopAlerts = alerts.filter((alert) =>
                      alert.informedEntity.some((entity) => entity.stopId === stop.stopId)
                    );

                    return (
                      <SortableStationWrapper
                        key={stop.compositeKey}
                        id={stop.compositeKey}
                        editMode={editMode}
                      >
                        <NewStationCard
                          stationName={stop.stopName}
                          arrivals={stop.arrivals}
                          alerts={stopAlerts}
                          now={now}
                          onAlertClick={setSelectedAlerts}
                        />
                      </SortableStationWrapper>
                    );
                  })}
                </AnimatePresence>
              </motion.div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      {/* Stop Selector Modal */}
      <StopSelector
        isOpen={stopSelectorOpen}
        onClose={() => setStopSelectorOpen(false)}
        selectedStops={selectedStops}
        onStopsChange={setSelectedStops}
        favoriteStops={favoriteStops}
        onToggleFavorite={handleToggleFavorite}
      />

      {/* Alert Modal */}
      <AlertModal alerts={selectedAlerts} onClose={() => setSelectedAlerts(null)} />
    </main>
  );
}
