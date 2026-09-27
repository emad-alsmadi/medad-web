import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  useCreateCrimeType,
  useUpdateCrimeType,
} from '@/hooks/crime-types/use-crime-type-mutations';
import { ApiError } from '@/lib/api/client';
import type { ApiErrorBody } from '@/types/api';
import type { CrimeTypeResponse } from '@/types/crime-type';

const crimeTypeSchema = z.object({
  name: z.string().trim().min(1, 'الاسم مطلوب').max(150, 'يجب ألا يتجاوز 150 حرفًا'),
});

type CrimeTypeFormValues = z.infer<typeof crimeTypeSchema>;

interface CrimeTypeFormDialogProps {
  /** When provided, the dialog edits this crime type; otherwise it creates a new one. */
  crimeType?: CrimeTypeResponse;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CrimeTypeFormDialog({ crimeType, open, onOpenChange }: CrimeTypeFormDialogProps) {
  const createMutation = useCreateCrimeType();
  const updateMutation = useUpdateCrimeType(crimeType?.id ?? -1);
  const mutation = crimeType ? updateMutation : createMutation;

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<CrimeTypeFormValues>({
    resolver: zodResolver(crimeTypeSchema),
    values: { name: crimeType?.name ?? '' },
  });

  const onSubmit = handleSubmit((values) => {
    mutation.mutate(values, {
      onSuccess: () => onOpenChange(false),
      onError: (error) => {
        if (!(error instanceof ApiError)) return;
        if (error.status === 409) {
          setError('name', { message: 'يوجد نوع جرم بهذا الاسم مسبقًا.' });
          return;
        }
        if (error.status === 400) {
          const body = error.details as ApiErrorBody | undefined;
          const message = body?.fieldErrors?.name;
          if (message) setError('name', { message });
        }
      },
    });
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>{crimeType ? 'تعديل نوع الجرم' : 'نوع جرم جديد'}</DialogTitle>
        <form onSubmit={(e) => void onSubmit(e)} noValidate className="space-y-4">
          <FormField label="الاسم" htmlFor="crime-type-name" error={errors.name?.message} required>
            <Input
              id="crime-type-name"
              aria-invalid={Boolean(errors.name)}
              {...register('name')}
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
