'use client';

import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

interface FavoriteButtonProps {
  isFavorited: boolean;
  onToggle: () => void;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
};

export function FavoriteButton({ isFavorited, onToggle, size = 'md' }: FavoriteButtonProps) {
  return (
    <motion.button
      onClick={onToggle}
      className="text-foreground hover:text-muted-foreground transition-colors"
      whileTap={{ scale: 0.9 }}
      aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
    >
      <motion.div
        animate={{
          scale: isFavorited ? [1, 1.3, 1] : 1,
          rotate: isFavorited ? [0, -10, 10, 0] : 0,
        }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        <Star
          className={sizeClasses[size]}
          fill={isFavorited ? 'currentColor' : 'none'}
          strokeWidth={2}
        />
      </motion.div>
    </motion.button>
  );
}
