'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

export type ToastType = 'error' | 'success' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
  showError: (message: string, err?: unknown) => void;
  showSuccess: (message: string) => void;
}

const ToastContext = createContext<ToastContextType>({
  showToast: () => {},
  showError: () => {},
  showSuccess: () => {},
});

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      removeToast(id);
    }, 5000);
  }, [removeToast]);

  const showError = useCallback((message: string, err?: unknown) => {
    let detail = message;
    if (err) {
      if (typeof err === 'object' && err !== null && 'message' in err) {
        detail = `${message}: ${(err as { message: string }).message}`;
      } else if (typeof err === 'string') {
        detail = `${message}: ${err}`;
      }
      console.error('[Supabase Error]', message, err);
    } else {
      console.error('[Supabase Error]', message);
    }
    showToast(detail, 'error');
  }, [showToast]);

  const showSuccess = useCallback((message: string) => {
    showToast(message, 'success');
  }, [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, showError, showSuccess }}>
      {children}
      {/* Floating Toasts Container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-md w-full px-4 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start justify-between gap-3 p-4 rounded-xl shadow-xl border backdrop-blur-md transition-all duration-300 animate-slide-up ${
              toast.type === 'error'
                ? 'bg-red-500/95 text-white border-red-400'
                : toast.type === 'success'
                ? 'bg-emerald-600/95 text-white border-emerald-500'
                : 'bg-secondary-blue/95 text-white border-blue-400'
            }`}
          >
            <div className="flex items-start gap-2.5 flex-1">
              {toast.type === 'error' && <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />}
              {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />}
              {toast.type === 'info' && <Info className="w-5 h-5 shrink-0 mt-0.5" />}
              <span className="text-xs sm:text-sm font-semibold leading-snug">{toast.message}</span>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-white/80 hover:text-white transition-colors p-0.5 rounded-lg hover:bg-white/20"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
