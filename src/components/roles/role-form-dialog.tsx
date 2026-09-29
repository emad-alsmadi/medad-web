import { useEffect, useRef } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { PermissionMatrix } from '@/components/roles/permission-matrix';
import { useAuthContext } from '@/contexts/auth-context';
import { useRoleOptions } from '@/hooks/roles/use-roles';
import { useCreateRole, useUpdateRole } from '@/hooks/roles/use-role-mutations';
import { ApiError } from '@/lib/api/client';
import { withRequiredPermissions } from '@/lib/auth/permissions';
import type { ApiErrorBody } from '@/types/api';
import type { Action, Resource, RoleResponse } from '@/types/role';

const roleSchema = z.object({
  name: z.string().trim().min(1, 'اسم الدور مطلوب').max(100, 'يجب ألا يتجاوز 100 حرف'),
  permissions: z.record(z.array(z.string())),
});

interface RoleFormValues {
  name: string;
  permissions: Partial<Record<Resource, Action[]>>;
}

interface RoleFormDialogProps {
  /** Omitted to create a new role. */
  role?: RoleResponse;
  /** Shows the role without letting it be changed (مدير النظام, or a role beyond the viewer's own). */
  readOnly?: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RoleFormDialog({ role, readOnly, open, onOpenChange }: RoleFormDialogProps) {
  const { user } = useAuthContext();
  const { data: options, isPending: optionsPending, isError: optionsError } = useRoleOptions();
  const createMutation = useCreateRole();
  const updateMutation = useUpdateRole();
  const mutation = role ? updateMutation : createMutation;
  const {
    register,
    control,
    handleSubmit,
    setError,
    getValues,
    setValue,
    formState: { errors },
  } = useForm<RoleFormValues>({
    resolver: zodResolver(roleSchema),
    defaultValues: { name: role?.name ?? '', permissions: role?.permissions ?? {} },
  });

  // A role saved without what its permissions require opens with it filled in, once the
  // requirements (GET /roles/options) are known — so saving it can't keep the gap.
  const completed = useRef(false);
  useEffect(() => {
    if (!options || readOnly || completed.current) return;
    completed.current = true;
    setValue(
      'permissions',
      withRequiredPermissions(getValues('permissions'), options.permissions, user?.permissions),
    );
  }, [options, readOnly, getValues, setValue, user?.permissions]);

  const onSubmit = handleSubmit((values) => {
    // PUT replaces the whole set, so every resource is sent, even an empty one.
    const body = { name: values.name.trim(), permissions: values.permissions };
    const onError = (error: Error) => {
      if (error instanceof ApiError && error.status === 400) {
        const fieldErrors = (error.details as ApiErrorBody | undefined)?.fieldErrors ?? {};
        if (fieldErrors.name) setError('name', { message: fieldErrors.name });
        else setError('root', { message: 'البيانات المُرسلة غير صالحة.' });
      }
    };
    const onSuccess = () => onOpenChange(false);
    if (role) updateMutation.mutate({ id: role.id, body }, { onSuccess, onError });
    else createMutation.mutate(body, { onSuccess, onError });
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogTitle>
          {!role ? 'دور جديد' : readOnly ? `الدور «${role.name}»` : `تعديل الدور «${role.name}»`}
        </DialogTitle>
        <DialogDescription>
          {readOnly
            ? role?.builtIn === 'ADMIN'
              ? 'دور مدير النظام يملك كل الصلاحيات دائمًا ولا يُعدَّل.'
              : 'لا يمكنك تعديل هذا الدور لأنه يمنح صلاحيات لا تملكها.'
            : 'يسري أي تغيير على كل مستخدمي الدور فورًا. لا يمكن منح صلاحية لا تملكها أنت.'}
        </DialogDescription>
        <form onSubmit={(e) => void onSubmit(e)} noValidate className="space-y-4">
          <FormField label="اسم الدور" htmlFor="roleName" error={errors.name?.message} required>
            <Input
              id="roleName"
              aria-invalid={Boolean(errors.name)}
              placeholder="مثال: ضابط مخفر"
              disabled={readOnly}
              {...register('name')}
            />
          </FormField>

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">الصلاحيات</legend>
            {optionsPending && <Skeleton className="h-48 w-full" />}
            {optionsError && (
              <p role="alert" className="text-sm text-destructive">
                تعذّر تحميل قائمة الصلاحيات.
              </p>
            )}
            {options && (
              <Controller
                control={control}
                name="permissions"
                render={({ field }) => (
                  <PermissionMatrix
                    options={options}
                    value={field.value}
                    onChange={field.onChange}
                    held={user?.permissions}
                    readOnly={readOnly}
                  />
                )}
              />
            )}
          </fieldset>

          {errors.root && (
            <p role="alert" className="text-sm text-destructive">
              {errors.root.message}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {readOnly ? 'إغلاق' : 'إلغاء'}
            </Button>
            {!readOnly && (
              <Button type="submit" disabled={mutation.isPending || !options}>
                {mutation.isPending ? 'جاري الحفظ…' : role ? 'حفظ' : 'إنشاء الدور'}
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
