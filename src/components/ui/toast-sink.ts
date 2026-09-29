import type { ToastOptions, ToastVariant } from './toast-context';

type ToastSink = (message: string, variant: ToastVariant, opts?: ToastOptions) => void;

let sink: ToastSink | null = null;
/** Toasts raised before the provider registers (a child effect on first load runs before its). */
let pending: Parameters<ToastSink>[] = [];

/**
 * Lets ToastProvider (mounted once near the app root) receive calls from
 * plain modules like src/lib/notifications/toast.ts, which run outside
 * React and can't use the useToast() hook.
 */
export function registerToastSink(fn: ToastSink | null) {
  sink = fn;
  if (!fn) return;
  const queued = pending;
  pending = [];
  queued.forEach((args) => fn(...args));
}

export function emitToast(message: string, variant: ToastVariant, opts?: ToastOptions) {
  if (!sink) {
    pending.push([message, variant, opts]);
    return;
  }
  sink(message, variant, opts);
}
