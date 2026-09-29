import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Button } from '@/components/ui/button';
import { RoleSelect } from '@/components/admin/users/role-select';
import { useCreateUser } from '@/hooks/users/use-create-user';
import { useRoles } from '@/hooks/roles/use-roles';
import { useCan } from '@/hooks/auth/use-can';
import { ApiError } from '@/lib/api/client';
import type { ApiErrorBody } from '@/types/api';

const baseSchema = z.object({
  fullName: z.string().min(1, 'هذا الحقل مطلوب'),
  email: z.string().min(1, 'البريد الإلكتروني مطلوب').email('أدخل بريدًا إلكترونيًا صالحًا'),
  password: z.string().min(8, 'يجب ألا تقل كلمة المرور عن 8 أحرف'),
  roleId: z.string(),
});

const withRoleSchema = baseSchema.extend({ roleId: z.string().min(1, 'اختر الدور') });

type CreateUserFormValues = z.infer<typeof baseSchema>;

interface CreateUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * With ROLES:VIEW the role is picked here (POST /users). Without it the
 * roles can't be listed, so the account is created with the built-in
 * «مستخدم» role instead (POST /auth/register).
 */
export function CreateUserDialog({ open, onOpenChange }: CreateUserDialogProps) {
  const canPickRole = useCan()('ROLES', 'VIEW');
  const { data: roles = [], isPending: rolesPending } = useRoles({ enabled: canPickRole && open });
  const mutation = useCreateUser();
  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<CreateUserFormValues>({
    resolver: zodResolver(canPickRole ? withRoleSchema : baseSchema),
    defaultValues: { fullName: '', email: '', password: '', roleId: '' },
  });

  const onSubmit = handleSubmit(({ roleId, ...values }) => {
    mutation.mutate(
      { ...values, roleId: canPickRole ? Number(roleId) : undefined },
      {
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
      },
    );
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
          {canPickRole
            ? 'يمكن تعديل الدور وبيانات الضبط لاحقًا من القائمة.'
            : 'سيُنشأ الحساب بدور "مستخدم"؛ يمكن تعديل بيانات الضبط لاحقًا من القائمة.'}
        </DialogDescription>
        <form onSubmit={(e) => void onSubmit(e)} noValidate className="space-y-4">
          <FormField
            label="الاسم الكامل"
            htmlFor="fullName"
            error={errors.fullName?.message}
            required
          >
            <Input
              id="fullName"
              autoComplete="name"
              aria-invalid={Boolean(errors.fullName)}
              {...register('fullName')}
            />
          </FormField>
          <FormField
            label="البريد الإلكتروني"
            htmlFor="email"
            error={errors.email?.message}
            required
          >
            <Input
              id="email"
              type="email"
              autoComplete="email"
              aria-invalid={Boolean(errors.email)}
              {...register('email')}
            />
          </FormField>
          <FormField
            label="كلمة المرور"
            htmlFor="password"
            error={errors.password?.message}
            required
          >
            <PasswordInput
              id="password"
              autoComplete="new-password"
              aria-invalid={Boolean(errors.password)}
              {...register('password')}
            />
          </FormField>
          {canPickRole && (
            <FormField label="الدور" htmlFor="roleId" error={errors.roleId?.message} required>
              <Controller
                control={control}
                name="roleId"
                render={({ field }) => (
                  <RoleSelect
                    id="roleId"
                    roles={roles}
                    value={field.value}
                    onChange={field.onChange}
                    invalid={Boolean(errors.roleId)}
                    disabled={rolesPending}
                  />
                )}
              />
            </FormField>
          )}
          <Button type="submit" className="w-full" disabled={mutation.isPending}>
            {mutation.isPending ? 'جاري الإنشاء…' : 'إنشاء المستخدم'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
