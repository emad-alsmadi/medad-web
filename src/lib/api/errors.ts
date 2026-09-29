import { ApiError } from '@/lib/api/client';

export const FORBIDDEN_MESSAGE = 'ليس لديك صلاحية لتنفيذ هذا الإجراء.';

/**
 * A failed mutation's toast. A 403 means the role no longer grants the
 * action (roles change mid-session) — say so instead of "try again"; the
 * session resyncs on its own (lib/query/query-client).
 */
export function failureMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError && error.status === 403 ? FORBIDDEN_MESSAGE : fallback;
}

/** A 4xx is the server's answer (in use, not allowed, gone), so retrying the same request won't help. */
export function isFinalError(error: unknown): boolean {
  return error instanceof ApiError && error.status >= 400 && error.status < 500;
}

/** The whole minutes a 429 says to wait (rounded up by the backend), or null. */
export function retryAfterMinutes(error: unknown): number | null {
  if (!(error instanceof ApiError) || error.status !== 429) return null;
  const message = (error.details as { message?: string } | undefined)?.message ?? '';
  const minutes = Number(/in (\d+) minute/.exec(message)?.[1]);
  return minutes > 0 ? minutes : null;
}

function minutesText(minutes: number): string {
  if (minutes === 1) return 'دقيقة';
  if (minutes === 2) return 'دقيقتين';
  return minutes <= 10 ? `${minutes} دقائق` : `${minutes} دقيقة`;
}

/**
 * The toast for a 429 from sign-in or a password change (too many failed attempts), or null
 * for any other error. The wait is read from the message ("…try again in 3 minute(s)"), since
 * the backend doesn't expose Retry-After to the browser across origins.
 */
export function tooManyAttemptsMessage(error: unknown): string | null {
  if (!(error instanceof ApiError) || error.status !== 429) return null;
  const minutes = retryAfterMinutes(error);
  const wait = minutes ? `بعد ${minutesText(minutes)}` : 'لاحقًا';
  return `تم الإيقاف مؤقتًا بسبب محاولات فاشلة متكررة. حاول مرة أخرى ${wait}.`;
}
