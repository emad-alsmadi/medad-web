import { ApiError } from '@/lib/api/client';
import type { ApiErrorBody } from '@/types/api';

function messageOf(error: ApiError): string {
  return (error.details as ApiErrorBody | undefined)?.message ?? '';
}

/**
 * Arabic text for a failed action on a user account. The backend sends no
 * error codes, so its English messages tell the cases apart: a 409 "User
 * {id} is the last {role}" protects the last enabled admin, any other 409
 * is data in the way (a taken email on create, linked reports on delete),
 * and a 403 is the no-escalation rule (API guide §4.4).
 */
export function userActionErrorMessage(
  error: unknown,
  { conflict, fallback }: { conflict: string; fallback: string },
): string {
  if (!(error instanceof ApiError)) return fallback;
  if (error.status === 409) {
    return messageOf(error).includes('is the last')
      ? 'لا يمكن تنفيذ ذلك: هذا آخر مدير نظام مفعّل.'
      : conflict;
  }
  if (error.status === 403) {
    return 'لا يمكنك التصرف بمستخدم أو دور يملك صلاحيات لا تملكها.';
  }
  return fallback;
}
