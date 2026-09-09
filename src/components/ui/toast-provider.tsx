import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, Info, AlertTriangle, X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { registerToastSink } from './toast-sink';
import { ToastContext, type ToastOptions, type ToastVariant } from './toast-context';

type ToastItem = {
  id: string;
  title?: string;
  message: string;
  variant: ToastVariant;
  durationMs: number;
};

function uid() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const timersRef = useRef<Record<string, number>>({});

  const remove = useCallback((id: string) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
    const t = timersRef.current[id];
    if (t) {
      window.clearTimeout(t);
      delete timersRef.current[id];
    }
  }, []);

  const toast = useCallback(
    (message: string, variant: ToastVariant, opts?: ToastOptions) => {
      const id = uid();
      const durationMs = opts?.durationMs ?? 4000;

      setItems((prev) => [
        ...prev,
        {
          id,
          message,
          title: opts?.title,
          variant,
          durationMs,
        },
      ]);

      timersRef.current[id] = window.setTimeout(() => remove(id), durationMs);
    },
    [remove],
  );

  const value = useMemo(() => ({ toast }), [toast]);

  useEffect(() => {
    registerToastSink(toast);
    return () => registerToastSink(null);
  }, [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed start-4 top-4 z-[10090] flex w-[min(100vw-2rem,22rem)] flex-col gap-3"
        dir="rtl"
        aria-live="polite"
        aria-relevant="additions"
      >
        <AnimatePresence initial={false} mode="sync">
          {items.map((t) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: -10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.98 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className={cn(
                'pointer-events-auto overflow-hidden rounded-[14px] border bg-white/95 font-sans shadow-[0_20px_50px_rgba(15,23,42,0.12)] backdrop-blur-md',
                t.variant === 'success' && 'border-[#A7F3D0] shadow-[0_12px_32px_rgba(16,185,129,0.12)]',
                t.variant === 'error' && 'border-[#FECDD3] shadow-[0_12px_32px_rgba(244,63,94,0.1)]',
                t.variant === 'info' && 'border-[#BFEDEC] shadow-[0_12px_32px_rgba(15,143,139,0.12)]',
                t.variant === 'warning' && 'border-[#FDE68A] shadow-[0_12px_32px_rgba(217,119,6,0.12)]',
              )}
            >
              <div className="flex items-start gap-3 p-3.5 sm:p-4">
                <div
                  className={cn(
                    'mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] text-white',
                    t.variant === 'success' && 'bg-gradient-to-br from-[#059669] to-[#0F8F8B] shadow-[0_8px_20px_rgba(15,143,139,0.3)]',
                    t.variant === 'error' && 'bg-gradient-to-br from-[#E11D48] to-[#F43F5E] shadow-[0_8px_20px_rgba(225,29,72,0.25)]',
                    t.variant === 'info' && 'bg-gradient-to-br from-[#0F8F8B] to-[#14B3AE] shadow-[0_8px_20px_rgba(15,143,139,0.3)]',
                    t.variant === 'warning' && 'bg-gradient-to-br from-[#D97706] to-[#F59E0B] shadow-[0_8px_20px_rgba(217,119,6,0.28)]',
                  )}
                >
                  {t.variant === 'success' ? (
                    <CheckCircle2 className="h-5 w-5" aria-hidden />
                  ) : t.variant === 'warning' ? (
                    <AlertTriangle className="h-5 w-5" aria-hidden />
                  ) : t.variant === 'error' ? (
                    <AlertTriangle className="h-5 w-5" aria-hidden />
                  ) : (
                    <Info className="h-5 w-5" aria-hidden />
                  )}
                </div>

                <div className="min-w-0 flex-1 text-start">
                  {t.title ? <div className="text-[13px] font-extrabold text-[#101828]">{t.title}</div> : null}
                  <div className={cn('text-[13px] font-semibold leading-relaxed text-[#344054]', t.title && 'mt-0.5')}>
                    {t.message}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => remove(t.id)}
                  className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] text-[#667085] transition hover:bg-[#F2F4F7] hover:text-[#101828]"
                  aria-label="إغلاق الإشعار"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <motion.div
                aria-hidden
                className={cn(
                  'h-1 w-full',
                  t.variant === 'success' && 'bg-gradient-to-l from-[#0F8F8B] to-[#34D399]',
                  t.variant === 'error' && 'bg-gradient-to-l from-[#E11D48] to-[#FB7185]',
                  t.variant === 'info' && 'bg-gradient-to-l from-[#0B7C78] to-[#2DD4BF]',
                  t.variant === 'warning' && 'bg-gradient-to-l from-[#D97706] to-[#FCD34D]',
                )}
                initial={{ scaleX: 1 }}
                animate={{ scaleX: 0 }}
                transition={{ duration: t.durationMs / 1000, ease: 'linear' }}
                style={{ transformOrigin: 'right' }}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
