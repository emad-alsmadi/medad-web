import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Helmet } from 'react-helmet-async';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useReport } from '@/hooks/reports/use-report';
import { useReportTypes } from '@/hooks/report-types/use-report-types';
import { useCreateReport, useUpdateReport } from '@/hooks/reports/use-report-mutations';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ApiError } from '@/lib/api/client';
import type { ApiErrorBody } from '@/types/api';
import { ROUTES } from '@/constant/routes';

const reportSchema = z.object({
  reportNumber: z
    .string()
    .min(1, 'رقم التقرير مطلوب')
    .max(100, 'يجب ألا يتجاوز 100 حرف'),
  reportTypeId: z.string().min(1, 'نوع التقرير مطلوب'),
  reportDate: z.string().optional(),
  introduction: z.string().optional(),
  body: z.string().optional(),
  referral: z.string().optional(),
  conclusion: z.string().optional(),
  summary: z.string().optional(),
});

type ReportFormValues = z.infer<typeof reportSchema>;

const TEXT_FIELDS: {
  name: 'introduction' | 'body' | 'referral' | 'conclusion' | 'summary';
  label: string;
}[] = [
  { name: 'introduction', label: 'المقدمة' },
  { name: 'body', label: 'النص' },
  { name: 'referral', label: 'الإحالة' },
  { name: 'conclusion', label: 'الخاتمة' },
  { name: 'summary', label: 'الملخص' },
];

export function ReportFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const reportId = Number(id);
  const navigate = useNavigate();

  const { data: report, isPending: isReportPending } = useReport(reportId);
  const { data: types = [] } = useReportTypes();
  const createMutation = useCreateReport();
  const updateMutation = useUpdateReport(reportId);
  const mutation = isEdit ? updateMutation : createMutation;

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ReportFormValues>({
    resolver: zodResolver(reportSchema),
    values: report
      ? {
          reportNumber: report.reportNumber,
          reportTypeId: String(report.reportType.id),
          reportDate: report.reportDate,
          introduction: report.introduction ?? '',
          body: report.body ?? '',
          referral: report.referral ?? '',
          conclusion: report.conclusion ?? '',
          summary: report.summary ?? '',
        }
      : undefined,
  });

  if (isEdit && (!id || Number.isNaN(reportId))) {
    return <Navigate to={ROUTES.reports.list} replace />;
  }

  if (isEdit && isReportPending) {
    return (
      <Card>
        <CardContent className="space-y-2 p-6" aria-busy="true" aria-live="polite">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  const onSubmit = handleSubmit((values) => {
    const body = {
      reportNumber: values.reportNumber,
      reportTypeId: Number(values.reportTypeId),
      reportDate: values.reportDate || undefined,
      introduction: values.introduction || undefined,
      body: values.body || undefined,
      referral: values.referral || undefined,
      conclusion: values.conclusion || undefined,
      summary: values.summary || undefined,
    };

    mutation.mutate(body, {
      onSuccess: (data) => void navigate(ROUTES.reports.detail(data.id)),
      onError: (error) => {
        if (error instanceof ApiError && error.status === 400) {
          const errorBody = error.details as ApiErrorBody | undefined;
          Object.entries(errorBody?.fieldErrors ?? {}).forEach(([field, message]) => {
            setError(field as keyof ReportFormValues, { message });
          });
        }
        if (error instanceof ApiError && error.status === 409) {
          setError('reportNumber', { message: 'رقم التقرير موجود مسبقًا.' });
        }
      },
    });
  });

  return (
    <>
      <Helmet>
        <title>{isEdit ? 'تعديل التقرير' : 'إنشاء تقرير'}</title>
      </Helmet>
      <Card>
        <CardHeader>
          <CardTitle>{isEdit ? 'تعديل التقرير' : 'إنشاء تقرير'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => void onSubmit(e)} noValidate className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <FormField
                label="رقم التقرير"
                htmlFor="reportNumber"
                error={errors.reportNumber?.message}
              >
                <Input
                  id="reportNumber"
                  aria-invalid={Boolean(errors.reportNumber)}
                  {...register('reportNumber')}
                />
              </FormField>
              <FormField
                label="نوع التقرير"
                htmlFor="reportTypeId"
                error={errors.reportTypeId?.message}
              >
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

            {TEXT_FIELDS.map(({ name, label }) => (
              <FormField key={name} label={label} htmlFor={name} error={errors[name]?.message}>
                <Textarea id={name} {...register(name)} />
              </FormField>
            ))}

            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'جاري الحفظ…' : isEdit ? 'حفظ التغييرات' : 'إنشاء تقرير'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </>
  );
}
