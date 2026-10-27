'use client';

import { useEffect, useId } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export type ConfirmModalProps = {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDestructive?: boolean;
};

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = 'تایید',
  cancelText = 'انصراف',
  onConfirm,
  onCancel,
  isDestructive = false,
}: ConfirmModalProps) {
  const titleId = useId();
  const descId = useId();

  // Close on Escape key press
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  // Lock background scroll when open
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-soil-900/40 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={descId}
          dir="rtl"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              onCancel();
            }
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="w-full max-w-sm rounded-2xl bg-white dark:bg-flora-900 dark:border dark:border-dust-50/10 p-6 shadow-2xl dark:shadow-none"
          >
            <h3 id={titleId} className="text-lg font-black text-soil-900 dark:text-dust-50">
              {title}
            </h3>
            <p id={descId} className="mt-3 text-sm leading-7 text-soil-700/80 dark:text-dust-200/80">
              {message}
            </p>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 rounded-xl border border-soil-900/15 dark:border-dust-50/20 py-2.5 text-sm font-bold text-soil-900 dark:text-dust-50 transition hover:bg-soil-900/5 dark:hover:bg-flora-800 cursor-pointer"
              >
                {cancelText}
              </button>
              <button
                type="button"
                onClick={onConfirm}
                className={`flex-1 rounded-xl py-2.5 text-sm font-black text-white transition cursor-pointer ${
                  isDestructive
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-flora-900 hover:bg-flora-800'
                }`}
              >
                {confirmText}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
