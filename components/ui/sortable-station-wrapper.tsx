'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface SortableStationWrapperProps {
  id: string;
  children: React.ReactNode;
  editMode: boolean;
}

export function SortableStationWrapper({ id, children, editMode }: SortableStationWrapperProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled: !editMode });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: editMode ? 'grab' : 'default',
  };

  if (!editMode) {
    // When not in edit mode, render with framer motion animation
    return (
      <motion.div
        key={id}
        layout
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
      >
        {children}
      </motion.div>
    );
  }

  // When in edit mode, use sortable div
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        'transition-opacity',
        editMode && 'active:cursor-grabbing'
      )}
    >
      {children}
    </div>
  );
}
