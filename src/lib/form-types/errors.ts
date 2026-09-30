import { ApiError } from '@/lib/api/client';
import { failureMessage } from '@/lib/api/errors';
import type { ApiErrorBody } from '@/types/api';

/**
 * Types have two levels: main types group sub-types, and reports are filed under types
 * with nothing beneath them. The backend sends no error code, so the refusals of a
 * create/update are told apart by their message.
 */
export function formTypeSaveErrorMessage(error: unknown, fallback: string): string {
  if (!(error instanceof ApiError)) return fallback;
  const message = (error.details as ApiErrorBody | undefined)?.message ?? '';
  if (error.status === 409 && message.includes('has reports filed under it')) {
    return 'لا يمكن أن يكون هذا النموذج تصنيفًا رئيسيًا، لأن ضبوطًا مسجلة عليه.';
  }
  if (error.status === 409) return 'يوجد نموذج ضبط بهذا الاسم مسبقًا.';
  if (message.includes('is a sub-type')) {
    return 'التصنيف الرئيسي المختار يجب أن يكون نموذجًا رئيسيًا، لا نموذجًا فرعيًا.';
  }
  if (message.includes('has sub-types')) {
    return 'لهذا النموذج نماذج فرعية، فلا يمكن نقله تحت تصنيف آخر.';
  }
  return failureMessage(error, fallback);
}
