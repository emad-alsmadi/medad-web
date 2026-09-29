import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Printer, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useCan } from '@/hooks/auth/use-can';
import { useReportTemplate } from '@/hooks/report-templates/use-report-template';
import {
  useDeleteReportTemplate,
  useReportTemplatePdf,
  useSaveReportTemplate,
} from '@/hooks/report-templates/use-report-template-mutations';
import { ApiError } from '@/lib/api/client';
import type { ApiErrorBody } from '@/types/api';
import type { ReportTemplateResponse } from '@/types/report-template';
import type { FormTypeResponse } from '@/types/form-type';

const templateSchema = z.object({
  creator: z.string().optional(),
  writer: z.string().optional(),
  copyLabel: z.string().optional(),
  introduction: z.string().optional(),
  body: z.string().optional(),
  referral: z.string().optional(),
  conclusion: z.string().optional(),
  summary: z.string().optional(),
});

type TemplateFormValues = z.infer<typeof templateSchema>;

const TEXT_FIELDS: { name: keyof TemplateFormValues; label: string }[] = [
  { name: 'introduction', label: 'المقدمة' },
  { name: 'body', label: 'المتن' },
  { name: 'referral', label: 'الإحالة' },
  { name: 'conclusion', label: 'الخاتمة' },
  { name: 'summary', label: 'الملخص' },
];

function templateToFormValues(template?: ReportTemplateResponse): TemplateFormValues {
  return {
    creator: template?.creator ?? '',
    writer: template?.writer ?? '',
    copyLabel: template?.copyLabel ?? '',
    introduction: template?.introduction ?? '',
    body: template?.body ?? '',
    referral: template?.referral ?? '',
    conclusion: template?.conclusion ?? '',
    summary: template?.summary ?? '',
  };
}

interface FormTypeTemplateFormProps {
  formType: FormTypeResponse;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Manages a form type's template (the official ورقة ضبط text): default
 * text that pre-fills a new report's fields when that type is picked, plus
 * a blank printable PDF of the template. A form type has at most one template
 * (create and update both go through the same PUT — "save").
 */
export function FormTypeTemplateForm({
  formType,
  open,
  onOpenChange,
}: FormTypeTemplateFormProps) {
  // Creating, replacing or deleting a template counts as updating its form type.
  const canManage = useCan()('FORM_TYPES', 'UPDATE');
  const { data: template, isPending, isNotFound } = useReportTemplate(formType.id);
  const saveMutation = useSaveReportTemplate(formType.id);
  const deleteMutation = useDeleteReportTemplate(formType.id);
  const pdfMutation = useReportTemplatePdf();
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<TemplateFormValues>({
    resolver: zodResolver(templateSchema),
    values: templateToFormValues(template),
  });

  const onSubmit = handleSubmit((values) => {
    saveMutation.mutate(values, {
      onError: (error) => {
        if (error instanceof ApiError && error.status === 400) {
          const body = error.details as ApiErrorBody | undefined;
          Object.entries(body?.fieldErrors ?? {}).forEach(([field, message]) => {
            setError(field as keyof TemplateFormValues, { message });
          });
        }
      },
    });
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogTitle>نص {formType.name}</DialogTitle>
        <DialogDescription>
          نص ورقة الضبط الرسمية، يُستخدم لتعبئة حقول أي ضبط جديد على «{formType.name}» تلقائيًا.
        </DialogDescription>

        {isPending && (
          <div className="space-y-2" aria-busy="true" aria-live="polite">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-6 w-full" />
            ))}
          </div>
        )}

        {!isPending && (
          <form onSubmit={(e) => void onSubmit(e)} noValidate className="space-y-4">
            {isNotFound && (
              <p className="text-sm text-muted-foreground">
                {canManage
                  ? 'لا يوجد نص لهذا النموذج بعد. عبِّئ الحقول أدناه واحفظ لإنشائه.'
                  : 'لا يوجد نص لهذا النموذج بعد.'}
              </p>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <FormField label="المُنشئ" htmlFor="creator" error={errors.creator?.message}>
                <Input id="creator" disabled={!canManage} {...register('creator')} />
              </FormField>
              <FormField label="المُحرِّر" htmlFor="writer" error={errors.writer?.message}>
                <Input id="writer" disabled={!canManage} {...register('writer')} />
              </FormField>
              <FormField label="عنوان النسخة" htmlFor="copyLabel" error={errors.copyLabel?.message}>
                <Input id="copyLabel" disabled={!canManage} {...register('copyLabel')} />
              </FormField>
            </div>

            {TEXT_FIELDS.map(({ name, label }) => (
              <FormField key={name} label={label} htmlFor={name} error={errors[name]?.message}>
                <Textarea id={name} disabled={!canManage} {...register(name)} />
              </FormField>
            ))}

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={pdfMutation.isPending}
                onClick={() => pdfMutation.mutate(formType.id)}
              >
                <Printer />
                <span>{pdfMutation.isPending ? 'جاري التحضير…' : 'طباعة نموذج فارغ'}</span>
              </Button>
              {canManage && !isNotFound && (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => setConfirmingDelete(true)}
                >
                  <Trash2 />
                  <span>حذف النص</span>
                </Button>
              )}
              {canManage && (
                <Button type="submit" size="sm" disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? 'جاري الحفظ…' : 'حفظ'}
                </Button>
              )}
            </div>
          </form>
        )}

        {confirmingDelete && (
          <Dialog open onOpenChange={setConfirmingDelete}>
            <DialogContent>
              <DialogTitle>حذف نص النموذج</DialogTitle>
              <DialogDescription>
                هل أنت متأكد من حذف نص «{formType.name}»؟ لا يمكن التراجع عن هذا الإجراء.
              </DialogDescription>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setConfirmingDelete(false)}>
                  إلغاء
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  disabled={deleteMutation.isPending}
                  onClick={() =>
                    deleteMutation.mutate(undefined, {
                      onSuccess: () => setConfirmingDelete(false),
                    })
                  }
                >
                  {deleteMutation.isPending ? 'جاري الحذف…' : 'حذف'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  );
}
