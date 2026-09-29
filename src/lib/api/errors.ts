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
