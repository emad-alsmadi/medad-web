import { useForm } from 'react-hook-form';
import type { FieldPath, UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ApiError } from '@/lib/api/client';
import { isDuplicateReportNumberError } from '@/lib/reports/errors';
import type { ApiErrorBody } from '@/types/api';
import type {
  ReportRequest,
  ReportResponse,
  ReportResult,
  ReportType,
  SearchBroadcast,
} from '@/types/report';

/** Every field is a string in the form; '' means "not filled". Max lengths mirror the backend. */
const partySchema = z.object({
  name: z.string().max(200, 'يجب ألا يتجاوز 200 حرف'),
  motherName: z.string().max(100, 'يجب ألا يتجاوز 100 حرف'),
  nationalId: z.string().max(50, 'يجب ألا يتجاوز 50 حرفًا'),
  origin: z.string().max(100, 'يجب ألا يتجاوز 100 حرف'),
  residence: z.string().max(255, 'يجب ألا يتجاوز 255 حرفًا'),
});

const confiscationSchema = z.object({
  weapons: z.string(),
  vehicles: z.string(),
  drugs: z.string(),
  money: z.string(),
  seizedItems: z.string(),
  notes: z.string(),
});

export const reportSchema = z.object({
  reportNumber: z.string().trim().min(1, 'رقم الضبط مطلوب').max(100, 'يجب ألا يتجاوز 100 حرف'),
  reportDate: z.string(),
  type: z.string().min(1, 'نوع الضبط مطلوب'),
  formTypeId: z.string().min(1, 'اختر نموذج ضبط فرعيًا'),
  result: z.string().min(1, 'النتيجة مطلوبة'),
  crimeTypeId: z.string(),
  searchBroadcast: z.string(),
  prosecutionPermission: z.boolean(),
  discovered: z.boolean(),
  plaintiff: partySchema,
  defendant: partySchema,
  crimePlace: z.string().max(255, 'يجب ألا يتجاوز 255 حرفًا'),
  crimeDate: z.string(),
  actionTaken: z.string(),
  confiscation: confiscationSchema,
  // No length limit on the backend: the official templates' referral alone runs well past 100 chars.
  introduction: z.string(),
  body: z.string(),
  referral: z.string(),
  conclusion: z.string(),
  summary: z.string(),
});

export type ReportFormValues = z.infer<typeof reportSchema>;
export type PartyFormValues = z.infer<typeof partySchema>;
export type ConfiscationFormValues = z.infer<typeof confiscationSchema>;

export const REPORT_TEXT_FIELDS = [
  'introduction',
  'body',
  'referral',
  'conclusion',
  'summary',
] as const;

const EMPTY_PARTY: PartyFormValues = {
  name: '',
  motherName: '',
  nationalId: '',
  origin: '',
  residence: '',
};

const EMPTY_CONFISCATION: ConfiscationFormValues = {
  weapons: '',
  vehicles: '',
  drugs: '',
  money: '',
  seizedItems: '',
  notes: '',
};

export const EMPTY_REPORT_FORM: ReportFormValues = {
  reportNumber: '',
  reportDate: '',
  type: '',
  formTypeId: '',
  result: 'UNDER_INVESTIGATION',
  crimeTypeId: '',
  searchBroadcast: '',
  prosecutionPermission: false,
  discovered: false,
  plaintiff: EMPTY_PARTY,
  defendant: EMPTY_PARTY,
  crimePlace: '',
  crimeDate: '',
  actionTaken: '',
  confiscation: EMPTY_CONFISCATION,
  introduction: '',
  body: '',
  referral: '',
  conclusion: '',
  summary: '',
};

/** Maps each field of `record` through `map`, keeping the keys. */
function mapFields<T extends object, R>(
  record: T,
  map: (value: T[keyof T]) => R,
): { [K in keyof T]: R } {
  return Object.fromEntries(
    Object.entries(record).map(([key, value]) => [key, map(value as T[keyof T])]),
  ) as { [K in keyof T]: R };
}

const orEmpty = (value: string | null) => value ?? '';

function textOrNull(value: string): string | null {
  return value.trim() === '' ? null : value;
}

/** A party/confiscation with every field empty is sent as null (none). */
function objectOrNull<T extends object>(values: T): { [K in keyof T]: string | null } | null {
  const mapped = mapFields(values, (value) => textOrNull(value as string));
  return Object.values(mapped).every((value) => value === null) ? null : mapped;
}

export function reportToFormValues(report: ReportResponse): ReportFormValues {
  return {
    reportNumber: report.reportNumber,
    reportDate: report.reportDate,
    type: report.type ?? '',
    formTypeId: String(report.formType.id),
    result: report.result ?? '',
    crimeTypeId: report.crimeType ? String(report.crimeType.id) : '',
    searchBroadcast: report.searchBroadcast ?? '',
    prosecutionPermission: report.prosecutionPermission,
    discovered: report.discovered,
    plaintiff: report.plaintiff ? mapFields(report.plaintiff, orEmpty) : EMPTY_PARTY,
    defendant: report.defendant ? mapFields(report.defendant, orEmpty) : EMPTY_PARTY,
    crimePlace: report.crimePlace ?? '',
    crimeDate: report.crimeDate ?? '',
    actionTaken: report.actionTaken ?? '',
    confiscation: report.confiscation
      ? mapFields(report.confiscation, orEmpty)
      : EMPTY_CONFISCATION,
    introduction: report.introduction ?? '',
    body: report.body ?? '',
    referral: report.referral ?? '',
    conclusion: report.conclusion ?? '',
    summary: report.summary ?? '',
  };
}

/**
 * Maps the form to the full create/update body. Every field is always
 * sent, since PUT clears anything left out. Empty text is sent as null —
 * on create, leaving all five text fields empty makes the backend fill
 * them from the form type's official template.
 */
export function reportFormValuesToBody(values: ReportFormValues): ReportRequest {
  return {
    reportNumber: values.reportNumber.trim(),
    reportDate: values.reportDate || undefined,
    type: values.type as ReportType,
    formTypeId: Number(values.formTypeId),
    result: values.result as ReportResult,
    crimeTypeId: values.crimeTypeId ? Number(values.crimeTypeId) : null,
    searchBroadcast: (values.searchBroadcast || null) as SearchBroadcast | null,
    prosecutionPermission: values.prosecutionPermission,
    discovered: values.discovered,
    plaintiff: objectOrNull(values.plaintiff),
    defendant: objectOrNull(values.defendant),
    crimePlace: textOrNull(values.crimePlace),
    crimeDate: values.crimeDate || null,
    actionTaken: textOrNull(values.actionTaken),
    confiscation: objectOrNull(values.confiscation),
    introduction: textOrNull(values.introduction),
    body: textOrNull(values.body),
    referral: textOrNull(values.referral),
    conclusion: textOrNull(values.conclusion),
    summary: textOrNull(values.summary),
  };
}

export function useReportForm(values?: ReportFormValues): UseFormReturn<ReportFormValues> {
  return useForm<ReportFormValues>({
    resolver: zodResolver(reportSchema),
    defaultValues: EMPTY_REPORT_FORM,
    values,
  });
}

const FIELD_NAMES = new Set<string>(Object.keys(EMPTY_REPORT_FORM));

/**
 * Applies a failed create/update to the form: 400 field errors under their
 * fields (nested keys like `plaintiff.name` map directly), a 400 without
 * field errors (e.g. a category picked as formTypeId, or an unknown id)
 * under the form type, and a duplicate reportNumber (409) under the number.
 * A 409 for a CLOSED report is toasted by the mutation hook instead.
 */
export function applyReportFormApiError(
  error: unknown,
  setError: UseFormReturn<ReportFormValues>['setError'],
): void {
  if (!(error instanceof ApiError)) return;
  const body = error.details as ApiErrorBody | undefined;

  if (error.status === 400) {
    const fieldErrors = Object.entries(body?.fieldErrors ?? {});
    fieldErrors.forEach(([field, message]) => {
      const root = field.split('.')[0] ?? field;
      if (FIELD_NAMES.has(root)) {
        setError(field as FieldPath<ReportFormValues>, { message }, { shouldFocus: true });
      }
    });
    if (fieldErrors.length > 0) return;
    // "Form type {id} ({name}) has sub-types …" — a category was sent as formTypeId.
    if (body?.message?.startsWith('Form type')) {
      const message = 'النموذج المختار تصنيف رئيسي، اختر نموذجًا فرعيًا منه.';
      setError('formTypeId', { message });
      // The cascade select isn't a registered input, so it can't take focus — echo it by the submit button.
      setError('root', { message });
      return;
    }
    setError('root', { message: 'البيانات المُرسلة غير صالحة. يرجى مراجعة الحقول.' });
    return;
  }

  if (error.status === 404) {
    setError('root', {
      message: 'نموذج الضبط أو نوع الجرم المختار لم يعد موجودًا. يرجى إعادة الاختيار.',
    });
    return;
  }

  if (isDuplicateReportNumberError(error)) {
    setError('reportNumber', { message: 'رقم الضبط موجود مسبقًا.' }, { shouldFocus: true });
  }
}

export type ReportSectionKey = 'basics' | 'crime' | 'parties' | 'action' | 'text';

/** The form fields each section holds — used to flag a section that contains errors. */
export const REPORT_SECTION_FIELDS: Record<ReportSectionKey, (keyof ReportFormValues)[]> = {
  basics: ['reportNumber', 'reportDate', 'type', 'formTypeId', 'result'],
  crime: [
    'crimeTypeId',
    'crimePlace',
    'crimeDate',
    'searchBroadcast',
    'prosecutionPermission',
    'discovered',
  ],
  parties: ['plaintiff', 'defendant'],
  action: ['actionTaken', 'confiscation'],
  text: [...REPORT_TEXT_FIELDS],
};

/** The fields each section's progress counts, and how many answers that is in total. */
export const REPORT_SECTION_PROGRESS: Record<
  ReportSectionKey,
  { fields: (keyof ReportFormValues)[]; total: number }
> = {
  basics: { fields: ['reportNumber', 'type', 'formTypeId', 'result'], total: 4 },
  crime: { fields: ['crimeTypeId', 'crimePlace', 'crimeDate', 'searchBroadcast'], total: 4 },
  parties: { fields: ['plaintiff', 'defendant'], total: 10 },
  action: { fields: ['actionTaken', 'confiscation'], total: 7 },
  text: { fields: [...REPORT_TEXT_FIELDS], total: 5 },
};

/** How many non-blank text answers `values` hold, looking inside nested objects; booleans don't count. */
export function countFilled(values: unknown): number {
  if (typeof values === 'string') return values.trim() === '' ? 0 : 1;
  if (Array.isArray(values)) return values.reduce<number>((sum, v) => sum + countFilled(v), 0);
  if (values && typeof values === 'object') return countFilled(Object.values(values));
  return 0;
}
