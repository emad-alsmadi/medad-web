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

/** No official form needs more; guards against typos like 99999. */
const MAX_WITNESSES = 20;

const formTypeSchema = z.object({
  name: z.string().min(1, 'الاسم مطلوب').max(100, 'يجب ألا يتجاوز 100 حرف'),
  witnessNumber: z.coerce
    .number()
    .int('يجب أن يكون رقمًا صحيحًا')
    .min(0, 'يجب أن يكون 0 أو أكبر')
    .max(MAX_WITNESSES, `يجب ألا يتجاوز ${MAX_WITNESSES}`),
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

  // Two levels, as the backend enforces: a parent is a main type (one without a parent), and a
  // type with sub-types stays a main type. Types with reports are refused as parents on save (409).
  const hasSubTypes = (formType?.childrenCount ?? 0) > 0;
  const mainTypes = types.filter((t) => t.parentId === undefined && t.id !== formType?.id);
  // The current parent stays listed even if older data breaks the rule: keeping it always passes.
  const currentParent = types.find((t) => t.id === formType?.parentId);
  const parentOptions =
    currentParent && !mainTypes.includes(currentParent) ? [currentParent, ...mainTypes] : mainTypes;

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
              max={MAX_WITNESSES}
              aria-invalid={Boolean(errors.witnessNumber)}
              {...register('witnessNumber')}
            />
          </FormField>
          <FormField
            label="التصنيف الأب"
            htmlFor="parentId"
            error={errors.parentId?.message}
            hint={
              hasSubTypes
                ? 'لهذا النموذج نماذج فرعية، فيبقى نموذجًا رئيسيًا.'
                : 'النماذج الرئيسية فقط. لا يُختار نموذج مسجلة عليه ضبوط.'
            }
          >
            <Controller
              control={control}
              name="parentId"
              render={({ field }) => (
                <DropdownSelect
                  value={field.value === '' ? ROOT_PARENT : field.value}
                  onValueChange={(next) => field.onChange(next === ROOT_PARENT ? '' : next)}
                >
                  <DropdownSelectTrigger
                    id="parentId"
                    aria-invalid={Boolean(errors.parentId)}
                    disabled={hasSubTypes}
                  >
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
