import { ApiError } from '@/lib/api/client';
import type { ApiErrorBody } from '@/types/api';

/**
 * A 409 on a report means one of two things: its result is CLOSED
 * (تم ختم الضبط), or — on create/update — its reportNumber is taken. The
 * backend doesn't send an error code, so the two are told apart by the
 * message ("Report {id} is closed (تم ختم الضبط) and can no longer be …").
 */
export function isReportClosedError(error: unknown): boolean {
  if (!(error instanceof ApiError) || error.status !== 409) return false;
  const message = (error.details as ApiErrorBody | undefined)?.message ?? '';
  return message.includes('is closed') || message.includes('تم ختم الضبط');
}

export function isDuplicateReportNumberError(error: unknown): boolean {
  return error instanceof ApiError && error.status === 409 && !isReportClosedError(error);
}
