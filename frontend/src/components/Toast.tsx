'use client';

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
} from 'react';
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

/* ===== Types ===== */
type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  /** Track whether the toast is exiting for slide-out animation */
  exiting?: boolean;
}

interface ToastContextValue {
  showToast: (type: ToastType, message: string) => void;
}

/* ===== Context ===== */
const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return ctx;
}

/* ===== Individual Toast Component ===== */
function ToastItem({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: (id: string) => void;
}) {
  const iconMap: Record<ToastType, React.ReactNode> = {
    success: <CheckCircleIcon className="h-5 w-5 text-fireflies-success" />,
    error: <ExclamationCircleIcon className="h-5 w-5 text-fireflies-danger" />,
    info: <InformationCircleIcon className="h-5 w-5 text-fireflies-primary" />,
  };

  const borderMap: Record<ToastType, string> = {
    success: 'border-l-fireflies-success',
    error: 'border-l-fireflies-danger',
    info: 'border-l-fireflies-primary',
  };

  return (
    <div
      className={`
        flex items-start gap-3 w-80 px-4 py-3
        bg-white rounded-lg shadow-lg border border-fireflies-border border-l-4
        ${borderMap[toast.type]}
        ${toast.exiting ? 'animate-slide-out-right' : 'animate-slide-in-right'}
      `}
      role="alert"
    >
      <span className="mt-0.5 flex-shrink-0">{iconMap[toast.type]}</span>
      <p className="flex-1 text-sm text-fireflies-text-primary leading-snug">
        {toast.message}
      </p>
      <button
        onClick={() => onDismiss(toast.id)}
        className="flex-shrink-0 text-fireflies-text-muted hover:text-fireflies-text-secondary transition-colors"
        aria-label="Dismiss"
      >
        <XMarkIcon className="h-4 w-4" />
      </button>
    </div>
  );
}

/* ===== Toast Provider ===== */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Clean up all timers on unmount
  useEffect(() => {
    return () => {
      timersRef.current.forEach((timer) => clearTimeout(timer));
    };
  }, []);

  const dismiss = useCallback((id: string) => {
  // Clear the auto-dismiss timer if it still exists
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }

    // Mark as exiting so the slide-out animation plays
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, exiting: true } : t))
    );

    // Remove from DOM after animation completes (300ms)
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 300);
  }, []);
  const showToast = useCallback(
    (type: ToastType, message: string) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setToasts((prev) => [...prev, { id, type, message }]);

      // Auto-dismiss after 3 seconds
      const timer = setTimeout(() => {
        dismiss(id);
        timersRef.current.delete(id);
      }, 3000);
      timersRef.current.set(id, timer);
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast container — fixed top-right, stacked vertically */}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <ToastItem toast={toast} onDismiss={dismiss} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
