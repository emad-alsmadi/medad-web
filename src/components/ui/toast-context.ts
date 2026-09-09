import { createContext, useContext } from 'react';

export type ToastVariant = 'success' | 'error' | 'info' | 'warning';

export type ToastOptions = {
  title?: string;
  durationMs?: number;
};

export type ToastContextValue = {
  toast: (message: string, variant: ToastVariant, opts?: ToastOptions) => void;
};

export const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast يجب استدعاؤه داخل ToastProvider');
  }
  return ctx;
}
