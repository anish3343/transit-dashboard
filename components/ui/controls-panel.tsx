'use client';

import { motion } from 'framer-motion';
import { Star, Moon, Settings, Sun, Monitor } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ControlsPanelProps {
  ambientMode: boolean;
  onAmbientModeChange: (enabled: boolean) => void;
  showFavoritesOnly: boolean;
  onShowFavoritesOnlyChange: (enabled: boolean) => void;
  onOpenSettings: () => void;
  theme: 'light' | 'dark' | 'system';
  onThemeChange: (theme: 'light' | 'dark' | 'system') => void;
}

const themes = [
  { value: 'light' as const, icon: Sun, label: 'Light' },
  { value: 'system' as const, icon: Monitor, label: 'System' },
  { value: 'dark' as const, icon: Moon, label: 'Dark' },
];

export function ControlsPanel({
  ambientMode,
  onAmbientModeChange,
  showFavoritesOnly,
  onShowFavoritesOnlyChange,
  onOpenSettings,
  theme,
  onThemeChange,
}: ControlsPanelProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Favorites Filter Toggle */}
      <motion.button
        onClick={() => onShowFavoritesOnlyChange(!showFavoritesOnly)}
        className={cn(
          'px-4 py-2 rounded-sm border border-border flex items-center gap-2 text-sm font-medium transition-all',
          showFavoritesOnly
            ? 'bg-foreground text-background'
            : 'bg-background text-foreground hover:bg-muted'
        )}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        aria-label="Toggle favorites filter"
      >
        <Star
          className="w-4 h-4"
          fill={showFavoritesOnly ? 'currentColor' : 'none'}
        />
        <span>Favorites</span>
      </motion.button>

      {/* Ambient Mode Toggle */}
      <motion.button
        onClick={() => onAmbientModeChange(!ambientMode)}
        className={cn(
          'px-4 py-2 rounded-sm border border-border flex items-center gap-2 text-sm font-medium transition-all',
          ambientMode
            ? 'bg-foreground text-background'
            : 'bg-background text-foreground hover:bg-muted'
        )}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        aria-label="Toggle ambient mode"
      >
        <Moon className="w-4 h-4" />
        <span>Ambient</span>
      </motion.button>

      {/* Settings Button */}
      <motion.button
        onClick={onOpenSettings}
        className="px-4 py-2 rounded-sm border border-border flex items-center gap-2 text-sm font-medium transition-all bg-background text-foreground hover:bg-muted"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        aria-label="Open settings"
      >
        <Settings className="w-4 h-4" />
        <span>Settings</span>
      </motion.button>

      {/* Theme Switcher */}
      <div className="border border-border rounded-sm p-1 inline-flex gap-1">
        {themes.map(({ value, icon: Icon, label }) => {
          const isActive = theme === value;

          return (
            <motion.button
              key={value}
              onClick={() => onThemeChange(value)}
              className={cn(
                'relative px-3 py-1.5 rounded-sm text-sm font-medium transition-all flex items-center gap-1.5',
                isActive
                  ? 'bg-foreground text-background'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              aria-label={`Switch to ${label} theme`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{label}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
