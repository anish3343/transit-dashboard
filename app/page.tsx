// app/page.tsx
'use client'; // Marks this as a Client Component (allows hooks like useState)

import { useState, useEffect } from 'react';
import { STATIONS } from '../lib/stops';

export default function Dashboard() {
  const [data, setData] = useState<any[]>([]);
  const [now, setNow] = useState<number>(Date.now());
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
  const [alerts, setAlerts] = useState<any[]>([]);
  const [selectedAlerts, setSelectedAlerts] = useState<any[] | null>(null);

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

  const getTranslation = (ts: any) => {
    if (!ts || !ts.translation) return '';
    const translation = ts.translation.find((t: any) => t.language === 'en') || ts.translation[0];
    return translation ? translation.text : '';
  };

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

                    const routeAlerts = alerts.filter(alert => {
                      // 0. Check if alert's system matches arrival's system
                      if (!alert.systems || !alert.systems.includes(arrival.system)) {
                        return false;
                      }

                      // 1. Check if alert is currently active
                      if (alert.activePeriod && alert.activePeriod.length > 0) {
                        const isActive = alert.activePeriod.some((period: any) => {
                          const start = period.start ? Number(period.start) * 1000 : 0;
                          const end = period.end ? Number(period.end) * 1000 : Infinity;
                          return now >= start && now <= end;
                        });
                        if (!isActive) return false;
                      }

                      // 2. Check if alert pertains to this specific trip/route/station
                      return alert.informedEntity.some((entity: any) => {
                        if (entity.trip?.tripId && entity.trip.tripId !== arrival.tripId) return false;
                        if (entity.routeId && entity.routeId !== arrival.route) return false;
                        if (entity.stopId && entity.stopId !== arrival.stopId) return false;
                        return true;
                      });
                    });

                    return (
                      <li key={idx} className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          {/* Line Badge */}
                          {arrival.route && (
                            <span
                              className="text-sm font-bold px-2 py-1 rounded min-w-[2rem] text-center shadow-sm cursor-help"
                              style={{
                                backgroundColor: arrival.routeColor ? `#${arrival.routeColor}` : '#808183',
                                color: arrival.routeTextColor ? `#${arrival.routeTextColor}` : '#FFFFFF'
                              }}
                              title={arrival.routeLongName}
                            >
                              {arrival.routeShortName || arrival.routeLongName || arrival.route}
                            </span>
                          )}

                          {/* Track Badge */}
                          {arrival.track && (
                            <span className="text-sm font-bold px-2 py-1 rounded min-w-[2rem] text-center shadow-sm bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                              Trk {arrival.track}
                            </span>
                          )}

                          {/* Alert Icon */}
                          {routeAlerts.length > 0 && (
                            <button
                              onClick={() => setSelectedAlerts(routeAlerts)}
                              className="text-yellow-600 dark:text-yellow-400 hover:text-yellow-700 dark:hover:text-yellow-300 transition-colors"
                              title={`${routeAlerts.length} active alert(s)`}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                                <path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
                              </svg>
                            </button>
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

      {/* Alerts Modal */}
      {selectedAlerts && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedAlerts(null)}>
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b dark:border-gray-800 flex justify-between items-center sticky top-0 bg-white dark:bg-gray-900">
              <h3 className="text-xl font-bold">Service Alerts</h3>
              <button onClick={() => setSelectedAlerts(null)} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-6">
              {selectedAlerts.map((alert) => (
                <div key={alert.id} className="space-y-2">
                  <h4 className="font-bold text-lg text-yellow-700 dark:text-yellow-500">
                    {getTranslation(alert.headerText)}
                  </h4>
                  <div className="prose dark:prose-invert text-sm max-w-none">
                    {getTranslation(alert.descriptionText)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
