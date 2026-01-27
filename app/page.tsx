'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { STATIONS } from '../lib/stops';
import { StationCard } from '@/components/ui/station-card';
import { ThemeSwitcher } from '@/components/ui/theme-switcher';
import { AlertModal } from '@/components/ui/alert-modal';
import { StationLoadingState } from '@/components/ui/loading-state';
import type { Arrival, Alert } from '@/lib/types';

export default function Dashboard() {
  const [data, setData] = useState<Arrival[]>([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState<number>(Date.now());
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [selectedAlerts, setSelectedAlerts] = useState<Alert[] | null>(null);

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
        const uniqueFeeds = Array.from(new Set(STATIONS.map(s => s.feed)));

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

  return (
    <main className="min-h-screen p-4 sm:p-8 bg-background">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8"
      >
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">
            NYC Transit
          </h1>
          <p className="text-muted-foreground">
            Real-time arrivals for subway, bus, and Metro-North
          </p>
        </div>

        <ThemeSwitcher theme={theme} onThemeChange={setTheme} />
      </motion.div>

      {/* Station Cards Grid */}
      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {STATIONS.map((station) => (
            <StationLoadingState key={station.stopId} />
          ))}
        </div>
      ) : (
        <motion.div
          className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                staggerChildren: 0.1
              }
            }
          }}
        >
          {STATIONS.map((station) => {
            // Filter arrivals for this specific station that are in the future
            const stationArrivals = data
              .filter((a) => a.stopId === station.stopId)
              .filter((a) => a.arrivalTime * 1000 > now)
              .slice(0, 5);

            // Get alerts relevant to this station
            const stationAlerts = alerts.filter(alert =>
              alert.informedEntity.some(
                entity => entity.stopId === station.stopId
              )
            );

            return (
              <StationCard
                key={station.stopId}
                stationName={station.label}
                arrivals={stationArrivals}
                alerts={stationAlerts}
                now={now}
                onAlertClick={setSelectedAlerts}
              />
            );
          })}
        </motion.div>
      )}

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
