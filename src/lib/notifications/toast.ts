import { toast } from 'sonner';

/**
 * Thin wrapper around sonner. Feature code imports this instead of
 * calling sonner's `toast` directly, keeping one swap-out point if the
 * underlying library ever changes.
 */
export const notify = {
  success: (message: string) => toast.success(message),
  error: (message: string) => toast.error(message),
  info: (message: string) => toast(message),
};
