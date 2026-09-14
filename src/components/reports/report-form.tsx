import { useForm } from 'react-hook-form';
import type { UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useReportTypes } from '@/hooks/report-types/use-report-types';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { DictationTextarea } from '@/components/shared/dictation-textarea';
import { ApiError } from '@/lib/api/client';
import type { ApiErrorBody } from '@/types/api';
import type { ReportResponse } from '@/types/report';

export const reportSchema = z.object({
  reportNumber: z
    .string()
    .min(1, 'رقم الضبط مطلوب')
    .max(100, 'يجب ألا يتجاوز 100 حرف'),
  reportTypeId: z.string().min(1, 'نوع الضبط مطلوب'),
  reportDate: z.string().optional(),
  introduction: z.string().optional(),
  body: z.string().optional(),
  referral: z.string().optional(),
  conclusion: z.string().optional(),
  summary: z.string().optional(),
});

export type ReportFormValues = z.infer<typeof reportSchema>;

const TEXT_FIELDS: {
  name: 'introduction' | 'body' | 'referral' | 'conclusion' | 'summary';
  label: string;
  placeholder: string;
}[] = [
  {
    name: 'introduction',
    label: 'المقدمة',
    placeholder: 'اكتب مقدمة موجزة توضح موضوع الضبط والغرض منه...',
  },
  {
    name: 'body',
    label: 'المتن',
    placeholder: 'اكتب التفاصيل الكاملة للضبط هنا...',
  },
  {
    name: 'referral',
    label: 'الإحالة',
    placeholder: 'اذكر الجهة أو القسم الذي يُحال إليه الضبط (إن وجد)...',
  },
  {
    name: 'conclusion',
    label: 'الخاتمة',
    placeholder: 'اكتب الاستنتاج أو التوصية الختامية للضبط...',
  },
  {
    name: 'summary',
    label: 'الملخص',
    placeholder: 'اكتب ملخصًا مختصرًا لأهم نقاط الضبط...',
  },
];

export function reportToFormValues(report: ReportResponse): ReportFormValues {
  return {
    reportNumber: report.reportNumber,
    reportTypeId: String(report.reportType.id),
    reportDate: report.reportDate,
    introduction: report.introduction ?? '',
    body: report.body ?? '',
    referral: report.referral ?? '',
    conclusion: report.conclusion ?? '',
    summary: report.summary ?? '',
  };
}

export function useReportForm(values?: ReportFormValues): UseFormReturn<ReportFormValues> {
  return useForm<ReportFormValues>({
    resolver: zodResolver(reportSchema),
    values,
  });
}

/** Maps a submitted form's fields to the API's create/update request body. */
export function reportFormValuesToBody(values: ReportFormValues) {
  return {
    reportNumber: values.reportNumber,
    reportTypeId: Number(values.reportTypeId),
    reportDate: values.reportDate || undefined,
    introduction: values.introduction || undefined,
    body: values.body || undefined,
    referral: values.referral || undefined,
    conclusion: values.conclusion || undefined,
    summary: values.summary || undefined,
  };
}

/** Applies field-level errors from a 400/409 API response to the form. */
export function applyReportFormApiError(
  error: unknown,
  setError: UseFormReturn<ReportFormValues>['setError'],
): void {
  if (error instanceof ApiError && error.status === 400) {
    const errorBody = error.details as ApiErrorBody | undefined;
    Object.entries(errorBody?.fieldErrors ?? {}).forEach(([field, message]) => {
      setError(field as keyof ReportFormValues, { message });
    });
  }
  if (error instanceof ApiError && error.status === 409) {
    setError('reportNumber', { message: 'رقم الضبط موجود مسبقًا.' });
  }
}

interface ReportFormFieldsProps {
  form: UseFormReturn<ReportFormValues>;
}

/**
 * The report create/edit form fields, shared between the "create" dialog
 * (reports-list-page) and the full edit page (report-form-page). Callers
 * own the <form> element, submit handling, and the submit button so each
 * can render its own layout/actions around these fields.
 */
export function ReportFormFields({ form }: ReportFormFieldsProps) {
  const { register, setValue, getValues, formState: { errors } } = form;
  const { data: types = [] } = useReportTypes();

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <FormField label="رقم الضبط" htmlFor="reportNumber" error={errors.reportNumber?.message}>
          <Input
            id="reportNumber"
            placeholder="مثال: 2024-015"
            aria-invalid={Boolean(errors.reportNumber)}
            {...register('reportNumber')}
          />
        </FormField>
        <FormField label="نوع الضبط" htmlFor="reportTypeId" error={errors.reportTypeId?.message}>
          <Select
            id="reportTypeId"
            aria-invalid={Boolean(errors.reportTypeId)}
            {...register('reportTypeId')}
          >
            <option value="">اختر نوعًا</option>
            {types.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="التاريخ" htmlFor="reportDate" error={errors.reportDate?.message}>
          <Input id="reportDate" type="date" {...register('reportDate')} />
        </FormField>
      </div>

      {TEXT_FIELDS.map(({ name, label, placeholder }) => (
        <FormField key={name} label={label} htmlFor={name} error={errors[name]?.message}>
          <DictationTextarea
            id={name}
            placeholder={placeholder}
            onDictatedText={(text) => {
              const current = getValues(name) ?? '';
              setValue(name, current ? `${current} ${text}` : text, { shouldDirty: true });
            }}
            {...register(name)}
          />
        </FormField>
      ))}
    </>
  );
}

interface ReportFormSubmitButtonProps {
  isPending: boolean;
  isEdit: boolean;
}

export function ReportFormSubmitButton({ isPending, isEdit }: ReportFormSubmitButtonProps) {
  return (
    <Button type="submit" disabled={isPending}>
      {isPending ? 'جاري الحفظ…' : isEdit ? 'حفظ التغييرات' : 'إنشاء ضبط'}
    </Button>
  );
}
