import { useState } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { FormField } from '@/components/ui/form-field';
import { Button } from '@/components/ui/button';
import { RoleSelect } from '@/components/admin/users/role-select';
import { useRoles } from '@/hooks/roles/use-roles';
import { useSetUserRole } from '@/hooks/users/use-set-user-role';
import type { UserResponse } from '@/types/user';

interface ChangeRoleDialogProps {
  user: UserResponse;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** PUT /users/{id}/role — the new permissions apply on the user's very next request. */
export function ChangeRoleDialog({ user, open, onOpenChange }: ChangeRoleDialogProps) {
  const { data: roles = [], isPending } = useRoles();
  const mutation = useSetUserRole();
  const [roleId, setRoleId] = useState(user.role ? String(user.role.id) : '');
  const unchanged = roleId === '' || Number(roleId) === user.role?.id;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>تغيير الدور</DialogTitle>
        <DialogDescription>
          تسري صلاحيات الدور الجديد على <strong>{user.fullName}</strong> فورًا، دون إعادة تسجيل
          الدخول.
        </DialogDescription>
        <form
          noValidate
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (unchanged) return;
            mutation.mutate(
              { id: user.id, roleId: Number(roleId) },
              { onSuccess: () => onOpenChange(false) },
            );
          }}
        >
          <FormField label="الدور" htmlFor="changeRoleId" required>
            <RoleSelect
              id="changeRoleId"
              roles={roles}
              value={roleId}
              onChange={setRoleId}
              disabled={isPending}
            />
          </FormField>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              إلغاء
            </Button>
            <Button type="submit" disabled={unchanged || mutation.isPending}>
              {mutation.isPending ? 'جاري الحفظ…' : 'حفظ'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
