import { useCan } from '@/hooks/auth/use-can';

/** Why create/edit is offered but disabled: the form picks its form type from /form-types. */
export const REPORT_FORM_NEEDS_FORM_TYPES =
  'يتطلب صلاحية «استعراض» أنواع نماذج الضبوط لاختيار نموذج الضبط. راجع مدير النظام.';

/**
 * What the signed-in user may do with reports. Creating and editing also
 * need FORM_TYPES:VIEW (API guide §4.1) — without it the
 * action is still shown, disabled with REPORT_FORM_NEEDS_FORM_TYPES, so a
 * half-configured role explains itself instead of silently hiding buttons.
 */
export function useReportPermissions() {
  const can = useCan();
  return {
    canCreate: can('REPORTS', 'CREATE'),
    canUpdate: can('REPORTS', 'UPDATE'),
    canDelete: can('REPORTS', 'DELETE'),
    formNeedsFormTypes: !can('FORM_TYPES', 'VIEW'),
  };
}
