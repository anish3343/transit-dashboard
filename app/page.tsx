'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { STATIONS } from '../lib/stops';
import { StationCard } from '@/components/ui/station-card';
import { ControlsPanel } from '@/components/ui/controls-panel';
import { SettingsModal } from '@/components/ui/settings-modal';
import { AlertModal } from '@/components/ui/alert-modal';
import { StationLoadingState } from '@/components/ui/loading-state';
import type { Arrival, Alert } from '@/lib/types';
import {
  getFavorites,
  setFavorites as saveFavorites,
  getFavoriteOrder,
  setFavoriteOrder as saveFavoriteOrder,
  getAmbientMode,
  setAmbientMode as saveAmbientMode,
  getShowFavoritesOnly,
  setShowFavoritesOnly as saveShowFavoritesOnly,
  validateFavorites,
  validateFavoriteOrder,
} from '@/lib/storage';

export default function Dashboard() {
  const [data, setData] = useState<Arrival[]>([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState<number>(Date.now());
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [selectedAlerts, setSelectedAlerts] = useState<Alert[] | null>(null);

  // New state for favorites and ambient mode
  const [favorites, setFavorites] = useState<string[]>([]);
  const [favoriteOrder, setFavoriteOrder] = useState<string[]>([]);
  const [ambientMode, setAmbientMode] = useState(false);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Load favorites and preferences from localStorage on mount
  useEffect(() => {
    const loadedFavorites = getFavorites();
    const loadedOrder = getFavoriteOrder();
    const validStopIds = STATIONS.map((s) => s.stopId);

    // Validate and clean up loaded data
    const validFavorites = validateFavorites(loadedFavorites, validStopIds);
    const validOrder = validateFavoriteOrder(loadedOrder, validFavorites);

    setFavorites(validFavorites);
    setFavoriteOrder(validOrder);
    setAmbientMode(getAmbientMode());
    setShowFavoritesOnly(getShowFavoritesOnly());
  }, []);

  // Persist favorites to localStorage
  useEffect(() => {
    saveFavorites(favorites);
  }, [favorites]);

  // Persist favorite order to localStorage
  useEffect(() => {
    saveFavoriteOrder(favoriteOrder);
  }, [favoriteOrder]);

  // Persist ambient mode to localStorage
  useEffect(() => {
    saveAmbientMode(ambientMode);
  }, [ambientMode]);

  // Persist show favorites only to localStorage
  useEffect(() => {
    saveShowFavoritesOnly(showFavoritesOnly);
  }, [showFavoritesOnly]);

  // Keep favorite order in sync with favorites
  useEffect(() => {
    setFavoriteOrder((prev) => prev.filter((id) => favorites.includes(id)));
  }, [favorites]);

  // Apply ambient mode class to body
  useEffect(() => {
    document.body.classList.toggle('ambient', ambientMode);
    return () => document.body.classList.remove('ambient');
  }, [ambientMode]);

  // Handle Theme Switching
  useEffect(() => {
    const root = window.document.documentElement;
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
      const listener = (e: MediaQueryListEvent) =>
        applyTheme(e.matches ? 'dark' : 'light');
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    } else {
      applyTheme(theme);
    }
  }, [theme]);

  // Trigger GTFS Static Data Update on mount and every hour
  useEffect(() => {
    const updateGtfs = () => {
      fetch('/api/gtfs/update').catch(console.error);
    };
    updateGtfs();
    const interval = setInterval(updateGtfs, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Update "now" every minute to keep the countdowns fresh
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Fetch arrival data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const uniqueFeeds = Array.from(new Set(STATIONS.map((s) => s.feed)));

        const promises = uniqueFeeds.map(async (feed) => {
          const res = await fetch(`/api/${feed}`);
          if (!res.ok) return [];
          const json = await res.json();
          return json.arrivals || [];
        });

        const results = await Promise.all(promises);
        const allArrivals = results
          .flat()
          .sort((a: Arrival, b: Arrival) => a.arrivalTime - b.arrivalTime);
        setData(allArrivals);
      } catch (error) {
        console.error('Failed to fetch arrivals:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Fetch Service Alerts
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

  // Filter stations based on favorites
  const displayStations = showFavoritesOnly
    ? STATIONS.filter((s) => favorites.includes(s.stopId)).sort(
        (a, b) => favoriteOrder.indexOf(a.stopId) - favoriteOrder.indexOf(b.stopId)
      )
    : STATIONS;

  return (
    <main className="min-h-screen p-4 sm:p-6 md:p-8 lg:p-12 bg-background">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 lg:mb-12"
      >
        <div>
          <h1 className="text-4xl sm:text-5xl font-normal tracking-tight text-foreground mb-2">
            NYC Transit
          </h1>
          <p className="text-muted-foreground">
            Real-time arrivals for subway, bus, and Metro-North
          </p>
        </div>

        <ControlsPanel
          ambientMode={ambientMode}
          onAmbientModeChange={setAmbientMode}
          showFavoritesOnly={showFavoritesOnly}
          onShowFavoritesOnlyChange={setShowFavoritesOnly}
          onOpenSettings={() => setSettingsOpen(true)}
          theme={theme}
          onThemeChange={setTheme}
        />
      </motion.div>

      {/* Empty state when favorites filter is on but no favorites */}
      {showFavoritesOnly && displayStations.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-20 text-center"
        >
          <p className="text-lg text-foreground mb-2">No favorites selected</p>
          <p className="text-sm text-muted-foreground mb-6">
            Star stations to add them to your favorites
          </p>
          <button
            onClick={() => setSettingsOpen(true)}
            className="px-6 py-3 bg-foreground text-background rounded-sm font-medium hover:opacity-90 transition-opacity"
          >
            Open Settings
          </button>
        </motion.div>
      )}

      {/* Station Cards Grid */}
      {loading ? (
        <div className="grid gap-8 lg:gap-10 grid-cols-[repeat(auto-fit,minmax(300px,1fr))] md:grid-cols-[repeat(auto-fit,minmax(340px,1fr))] max-w-[1800px] mx-auto">
          {STATIONS.map((station) => (
            <StationLoadingState key={station.stopId} />
          ))}
        </div>
      ) : displayStations.length > 0 ? (
        <motion.div
          className="grid gap-8 lg:gap-10 grid-cols-[repeat(auto-fit,minmax(300px,1fr))] md:grid-cols-[repeat(auto-fit,minmax(340px,1fr))] max-w-[1800px] mx-auto"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                staggerChildren: 0.1,
              },
            },
          }}
        >
          {displayStations.map((station) => {
            // Filter arrivals for this specific station that are in the future
            const stationArrivals = data
              .filter((a) => a.stopId === station.stopId)
              .filter((a) => a.arrivalTime * 1000 > now)
              .slice(0, 5);

            // Get alerts relevant to this station
            const stationAlerts = alerts.filter((alert) =>
              alert.informedEntity.some((entity) => entity.stopId === station.stopId)
            );

            return (
              <StationCard
                key={station.stopId}
                stationName={station.label}
                arrivals={stationArrivals}
                alerts={stationAlerts}
                now={now}
                onAlertClick={setSelectedAlerts}
                isFavorited={favorites.includes(station.stopId)}
                onToggleFavorite={() => {
                  if (favorites.includes(station.stopId)) {
                    setFavorites(favorites.filter((id) => id !== station.stopId));
                  } else {
                    setFavorites([...favorites, station.stopId]);
                    setFavoriteOrder([...favoriteOrder, station.stopId]);
                  }
                }}
                ambientMode={ambientMode}
              />
            );
          })}
        </motion.div>
      ) : null}

      {/* Settings Modal */}
      <SettingsModal
        isOpen={settingsOpen}
        stations={STATIONS}
        favorites={favorites}
        favoriteOrder={favoriteOrder}
        onFavoritesChange={setFavorites}
        onOrderChange={setFavoriteOrder}
        onClose={() => setSettingsOpen(false)}
      />

      {/* Alert Modal */}
      <AlertModal alerts={selectedAlerts} onClose={() => setSelectedAlerts(null)} />

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-12 text-center text-sm text-muted-foreground"
      >
        <p>Data updates every 30 seconds • Last updated {new Date(now).toLocaleTimeString()}</p>
      </motion.footer>
    </main>
  );
}
