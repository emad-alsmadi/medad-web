import type { ToastOptions, ToastVariant } from './toast-context';

type ToastSink = (message: string, variant: ToastVariant, opts?: ToastOptions) => void;

let sink: ToastSink | null = null;

/**
 * Lets ToastProvider (mounted once near the app root) receive calls from
 * plain modules like src/lib/notifications/toast.ts, which run outside
 * React and can't use the useToast() hook.
 */
export function registerToastSink(fn: ToastSink | null) {
  sink = fn;
}

export function emitToast(message: string, variant: ToastVariant, opts?: ToastOptions) {
  if (!sink) {
    return;
  }
  sink(message, variant, opts);
}
