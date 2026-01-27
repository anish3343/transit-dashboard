'use client';

import { motion } from 'framer-motion';
import { Sun, Moon, Monitor } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ThemeSwitcherProps {
  theme: 'light' | 'dark' | 'system';
  onThemeChange: (theme: 'light' | 'dark' | 'system') => void;
}

const themes = [
  { value: 'light' as const, icon: Sun, label: 'Light' },
  { value: 'system' as const, icon: Monitor, label: 'System' },
  { value: 'dark' as const, icon: Moon, label: 'Dark' }
];

export function ThemeSwitcher({ theme, onThemeChange }: ThemeSwitcherProps) {
  return (
    <div className="neomorph-flat p-1.5 inline-flex gap-1 relative">
      {themes.map(({ value, icon: Icon, label }) => {
        const isActive = theme === value;

        return (
          <motion.button
            key={value}
            onClick={() => onThemeChange(value)}
            className={cn(
              "relative px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2",
              isActive
                ? "text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {isActive && (
              <motion.div
                layoutId="activeTheme"
                className="absolute inset-0 neomorph-inset rounded-xl"
                transition={{
                  type: "spring",
                  stiffness: 500,
                  damping: 30
                }}
              />
            )}
            <Icon className="w-4 h-4 relative z-10" />
            <span className="relative z-10">{label}</span>
          </motion.button>
        );
      })}
    </div>
  );
}
