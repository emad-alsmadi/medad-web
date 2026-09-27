import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import {
  DropdownSelect,
  DropdownSelectContent,
  DropdownSelectItem,
  DropdownSelectTrigger,
  DropdownSelectValue,
} from '@/components/ui/dropdown-select';
import { Button } from '@/components/ui/button';
import { useFormTypes } from '@/hooks/form-types/use-form-types';
import {
  useCreateFormType,
  useUpdateFormType,
} from '@/hooks/form-types/use-form-type-mutations';
import { ApiError } from '@/lib/api/client';
import type { ApiErrorBody } from '@/types/api';
import type { FormTypeResponse } from '@/types/form-type';

const formTypeSchema = z.object({
  name: z.string().min(1, 'الاسم مطلوب').max(100, 'يجب ألا يتجاوز 100 حرف'),
  witnessNumber: z.coerce.number().int('يجب أن يكون رقمًا صحيحًا').min(0, 'يجب أن يكون 0 أو أكبر'),
  parentId: z.string(),
});

type FormTypeFormValues = z.infer<typeof formTypeSchema>;

const ROOT_PARENT = 'root';

interface FormTypeFormProps {
  /** When provided, the form edits this type; otherwise it creates a new one. */
  formType?: FormTypeResponse;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** All ids that are `type` itself or one of its descendants, per the flat list's parentId links. */
function collectDescendantIds(types: FormTypeResponse[], rootId: number): Set<number> {
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

export function FormTypeForm({ formType, open, onOpenChange }: FormTypeFormProps) {
  const { data: types = [] } = useFormTypes();
  const createMutation = useCreateFormType();
  const updateMutation = useUpdateFormType(formType?.id ?? -1);
  const mutation = formType ? updateMutation : createMutation;

  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<FormTypeFormValues>({
    resolver: zodResolver(formTypeSchema),
    values: {
      name: formType?.name ?? '',
      witnessNumber: formType?.witnessNumber ?? 0,
      parentId: formType?.parentId !== undefined ? String(formType.parentId) : '',
    },
  });

  const excludedIds = formType ? collectDescendantIds(types, formType.id) : new Set<number>();
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
            setError(field as keyof FormTypeFormValues, { message });
          });
        }
      },
    });
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>{formType ? 'تعديل نموذج الضبط' : 'نموذج ضبط جديد'}</DialogTitle>
        <form onSubmit={(e) => void onSubmit(e)} noValidate className="space-y-4">
          <FormField label="الاسم" htmlFor="name" error={errors.name?.message} required>
            <Input id="name" aria-invalid={Boolean(errors.name)} {...register('name')} />
          </FormField>
          <FormField
            label="عدد الشهود"
            htmlFor="witnessNumber"
            error={errors.witnessNumber?.message}
            required
          >
            <Input
              id="witnessNumber"
              type="number"
              min={0}
              aria-invalid={Boolean(errors.witnessNumber)}
              {...register('witnessNumber')}
            />
          </FormField>
          <FormField label="التصنيف الأب" htmlFor="parentId" error={errors.parentId?.message}>
            <Controller
              control={control}
              name="parentId"
              render={({ field }) => (
                <DropdownSelect
                  value={field.value === '' ? ROOT_PARENT : field.value}
                  onValueChange={(next) => field.onChange(next === ROOT_PARENT ? '' : next)}
                >
                  <DropdownSelectTrigger id="parentId" aria-invalid={Boolean(errors.parentId)}>
                    <DropdownSelectValue />
                  </DropdownSelectTrigger>
                  <DropdownSelectContent>
                    <DropdownSelectItem value={ROOT_PARENT}>بلا (جذر)</DropdownSelectItem>
                    {parentOptions.map((t) => (
                      <DropdownSelectItem key={t.id} value={String(t.id)}>
                        {t.name}
                      </DropdownSelectItem>
                    ))}
                  </DropdownSelectContent>
                </DropdownSelect>
              )}
            />
          </FormField>
          <Button type="submit" className="w-full" disabled={mutation.isPending}>
            {mutation.isPending ? 'جاري الحفظ…' : 'حفظ'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
