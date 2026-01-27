'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle } from 'lucide-react';
import type { Alert } from '@/lib/types';

interface AlertModalProps {
  alerts: Alert[] | null;
  onClose: () => void;
}

function getTranslation(ts: any): string {
  if (!ts || !ts.translation) return '';
  const translation = ts.translation.find((t: any) => t.language === 'en') || ts.translation[0];
  return translation ? translation.text : '';
}

export function AlertModal({ alerts, onClose }: AlertModalProps) {
  return (
    <AnimatePresence>
      {alerts && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-[1px]"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card border border-border rounded-sm max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col pointer-events-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-card z-10">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                  <h3 className="text-2xl font-medium text-foreground">
                    Service Alerts
                  </h3>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </div>

              {/* Content */}
              <div className="overflow-y-auto p-6 space-y-6">
                {alerts.map((alert, index) => (
                  <motion.div
                    key={alert.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="border border-border rounded-sm p-6 space-y-3 bg-background"
                  >
                    <h4 className="font-medium text-lg text-yellow-700 dark:text-yellow-500 flex items-start gap-2">
                      <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                      <span>{getTranslation(alert.headerText)}</span>
                    </h4>
                    <div className="text-sm text-foreground leading-relaxed pl-7">
                      {getTranslation(alert.descriptionText)}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
