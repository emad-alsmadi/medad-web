import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Button } from '@/components/ui/button';
import { useCreateUser } from '@/hooks/users/use-create-user';
import { ApiError } from '@/lib/api/client';
import type { ApiErrorBody } from '@/types/api';

const createUserSchema = z.object({
  fullName: z.string().min(1, 'هذا الحقل مطلوب'),
  email: z.string().min(1, 'البريد الإلكتروني مطلوب').email('أدخل بريدًا إلكترونيًا صالحًا'),
  password: z.string().min(8, 'يجب ألا تقل كلمة المرور عن 8 أحرف'),
});

type CreateUserFormValues = z.infer<typeof createUserSchema>;

interface CreateUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Creates a user via POST /auth/register. The backend always assigns
 * the USER role server-side — there is no way to create an ADMIN from
 * the UI (or the API), so no role field is shown here.
 */
export function CreateUserDialog({ open, onOpenChange }: CreateUserDialogProps) {
  const mutation = useCreateUser();
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<CreateUserFormValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { fullName: '', email: '', password: '' },
  });

  const onSubmit = handleSubmit((values) => {
    mutation.mutate(values, {
      onSuccess: () => {
        reset();
        onOpenChange(false);
      },
      onError: (error) => {
        if (error instanceof ApiError && error.status === 400) {
          const body = error.details as ApiErrorBody | undefined;
          Object.entries(body?.fieldErrors ?? {}).forEach(([field, message]) => {
            setError(field as keyof CreateUserFormValues, { message });
          });
        }
      },
    });
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent>
        <DialogTitle>مستخدم جديد</DialogTitle>
        <DialogDescription>
          سيُنشأ الحساب بدور "مستخدم"؛ يمكن تعديل بيانات الضبط لاحقًا من القائمة.
        </DialogDescription>
        <form onSubmit={(e) => void onSubmit(e)} noValidate className="space-y-4">
          <FormField label="الاسم الكامل" htmlFor="fullName" error={errors.fullName?.message}>
            <Input
              id="fullName"
              autoComplete="name"
              aria-invalid={Boolean(errors.fullName)}
              {...register('fullName')}
            />
          </FormField>
          <FormField label="البريد الإلكتروني" htmlFor="email" error={errors.email?.message}>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              aria-invalid={Boolean(errors.email)}
              {...register('email')}
            />
          </FormField>
          <FormField label="كلمة المرور" htmlFor="password" error={errors.password?.message}>
            <PasswordInput
              id="password"
              autoComplete="new-password"
              aria-invalid={Boolean(errors.password)}
              {...register('password')}
            />
          </FormField>
          <Button type="submit" className="w-full" disabled={mutation.isPending}>
            {mutation.isPending ? 'جاري الإنشاء…' : 'إنشاء المستخدم'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
