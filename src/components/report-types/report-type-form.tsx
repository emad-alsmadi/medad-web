import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useReportTypes } from '@/hooks/report-types/use-report-types';
import {
  useCreateReportType,
  useUpdateReportType,
} from '@/hooks/report-types/use-report-type-mutations';
import { ApiError } from '@/lib/api/client';
import type { ApiErrorBody } from '@/types/api';
import type { ReportTypeResponse } from '@/types/report-type';

const reportTypeSchema = z.object({
  name: z.string().min(1, 'الاسم مطلوب').max(100, 'يجب ألا يتجاوز 100 حرف'),
  witnessNumber: z.coerce.number().int('يجب أن يكون رقمًا صحيحًا').min(0, 'يجب أن يكون 0 أو أكبر'),
  parentId: z.string(),
});

type ReportTypeFormValues = z.infer<typeof reportTypeSchema>;

interface ReportTypeFormProps {
  /** When provided, the form edits this type; otherwise it creates a new one. */
  reportType?: ReportTypeResponse;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** All ids that are `type` itself or one of its descendants, per the flat list's parentId links. */
function collectDescendantIds(types: ReportTypeResponse[], rootId: number): Set<number> {
  const ids = new Set<number>([rootId]);
  let added = true;
  while (added) {
    added = false;
    for (const t of types) {
      if (t.parentId !== undefined && ids.has(t.parentId) && !ids.has(t.id)) {
        ids.add(t.id);
        added = true;
      }
    }
  }
  return ids;
}

export function ReportTypeForm({ reportType, open, onOpenChange }: ReportTypeFormProps) {
  const { data: types = [] } = useReportTypes();
  const createMutation = useCreateReportType();
  const updateMutation = useUpdateReportType(reportType?.id ?? -1);
  const mutation = reportType ? updateMutation : createMutation;

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ReportTypeFormValues>({
    resolver: zodResolver(reportTypeSchema),
    values: {
      name: reportType?.name ?? '',
      witnessNumber: reportType?.witnessNumber ?? 0,
      parentId: reportType?.parentId !== undefined ? String(reportType.parentId) : '',
    },
  });

  const excludedIds = reportType ? collectDescendantIds(types, reportType.id) : new Set<number>();
  const parentOptions = types.filter((t) => !excludedIds.has(t.id));

  const onSubmit = handleSubmit((values) => {
    const body = {
      name: values.name,
      witnessNumber: values.witnessNumber,
      parentId: values.parentId === '' ? null : Number(values.parentId),
    };

    mutation.mutate(body, {
      onSuccess: () => onOpenChange(false),
      onError: (error) => {
        if (error instanceof ApiError && error.status === 400) {
          const body = error.details as ApiErrorBody | undefined;
          Object.entries(body?.fieldErrors ?? {}).forEach(([field, message]) => {
            setError(field as keyof ReportTypeFormValues, { message });
          });
        }
      },
    });
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>{reportType ? 'تعديل نوع التقرير' : 'نوع تقرير جديد'}</DialogTitle>
        <form onSubmit={(e) => void onSubmit(e)} noValidate className="space-y-4">
          <FormField label="الاسم" htmlFor="name" error={errors.name?.message}>
            <Input id="name" aria-invalid={Boolean(errors.name)} {...register('name')} />
          </FormField>
          <FormField
            label="عدد الشهود"
            htmlFor="witnessNumber"
            error={errors.witnessNumber?.message}
          >
            <Input
              id="witnessNumber"
              type="number"
              min={0}
              aria-invalid={Boolean(errors.witnessNumber)}
              {...register('witnessNumber')}
            />
          </FormField>
          <FormField label="النوع الأب" htmlFor="parentId" error={errors.parentId?.message}>
            <Select id="parentId" {...register('parentId')}>
              <option value="">بلا (جذر)</option>
              {parentOptions.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </Select>
          </FormField>
          <Button type="submit" className="w-full" disabled={mutation.isPending}>
            {mutation.isPending ? 'جاري الحفظ…' : 'حفظ'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
