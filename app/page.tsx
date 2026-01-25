// app/page.tsx
'use client'; // Marks this as a Client Component (allows hooks like useState)

import { useState, useEffect } from 'react';
import { STATIONS } from '../lib/stops';
import { getLineColor } from '../lib/colors';

export default function Dashboard() {
  const [data, setData] = useState<any[]>([]);
  const [now, setNow] = useState<number>(Date.now());
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');

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
      const listener = (e: MediaQueryListEvent) => applyTheme(e.matches ? 'dark' : 'light');
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
    updateGtfs(); // Run on startup
    const interval = setInterval(updateGtfs, 60 * 60 * 1000); // Run every hour
    return () => clearInterval(interval);
  }, []);

  // Update "now" every minute to keep the countdowns fresh
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      const uniqueFeeds = Array.from(new Set(STATIONS.map(s => s.feed)));

      const promises = uniqueFeeds.map(async (feed) => {
        const res = await fetch(`/api/${feed}`);
        if (!res.ok) return [];
        const json = await res.json();
        return json.arrivals || [];
      });

      const results = await Promise.all(promises);
      const allArrivals = results.flat().sort((a: any, b: any) => a.arrivalTime - b.arrivalTime);
      setData(allArrivals);
    };

    fetchData();
    // Poll every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <main className="min-h-screen p-8 bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100 transition-colors duration-200">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Transit Dashboard</h1>

        {/* Theme Switcher */}
        <div className="flex gap-1 bg-gray-200 dark:bg-gray-800 p-1 rounded-lg text-sm font-medium">
          {(['light', 'system', 'dark'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTheme(t)}
              className={`px-3 py-1 rounded-md capitalize ${theme === t ? 'bg-white dark:bg-gray-600 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'}`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {STATIONS.map((station) => {
          // Filter arrivals for this specific station that are in the future
          const stationArrivals = data
            .filter((a) => a.stopId === station.stopId)
            .filter((a) => a.arrivalTime * 1000 > now)
            .slice(0, 5); // Show next 5 arrivals

          return (
            <div key={station.stopId} className="border rounded-lg p-4 shadow-sm bg-white dark:bg-gray-900 dark:border-gray-800">
              <h2 className="text-xl font-semibold mb-4 border-b pb-2 dark:border-gray-800">
                {station.label}
              </h2>

              {stationArrivals.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 italic">No upcoming arrivals</p>
              ) : (
                <ul className="space-y-3">
                  {stationArrivals.map((arrival, idx) => {
                    const minutes = Math.round((arrival.arrivalTime * 1000 - now) / 60000);
                    const lineColor = getLineColor(arrival.route);

                    return (
                      <li key={idx} className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          {/* Line Badge */}
                          {arrival.route && (
                            <span
                              className="text-sm font-bold px-2 py-1 rounded min-w-[2rem] text-center shadow-sm"
                              style={{ backgroundColor: lineColor.bg, color: lineColor.text }}
                            >
                              {arrival.route}
                            </span>
                          )}
                          {arrival.destination && (
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              {arrival.destination}
                            </span>
                          )}
                        </div>
                        <div className="text-right">
                          <span className="block font-mono text-lg font-medium">
                            {minutes < 1 ? 'Now' : `${minutes} min`}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(arrival.arrivalTime * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </main>
  );
}
