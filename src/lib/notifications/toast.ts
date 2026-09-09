import { emitToast } from '@/components/ui/toast-sink';

/**
 * Thin wrapper around the app's ToastProvider. Feature code imports this
 * instead of calling emitToast/useToast directly, keeping one swap-out
 * point if the underlying implementation ever changes.
 */
export const notify = {
  success: (message: string) => emitToast(message, 'success'),
  error: (message: string) => emitToast(message, 'error'),
  warning: (message: string) => emitToast(message, 'warning'),
  info: (message: string) => emitToast(message, 'info'),
};
