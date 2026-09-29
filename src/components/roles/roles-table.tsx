import { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { EmptyState } from '@/components/shared/empty-state';
import { RoleFormDialog } from '@/components/roles/role-form-dialog';
import { useAuthContext } from '@/contexts/auth-context';
import { useCan } from '@/hooks/auth/use-can';
import { useDeleteRole } from '@/hooks/roles/use-role-mutations';
import { exceedsPermissions } from '@/lib/auth/permissions';
import type { RoleResponse } from '@/types/role';

const NUMBER_FORMAT = new Intl.NumberFormat('ar-SY-u-nu-latn');

function grantedCount(role: RoleResponse): number {
  return Object.values(role.permissions).reduce((sum, actions) => sum + actions.length, 0);
}

interface RolesTableProps {
  roles: RoleResponse[];
}

/**
 * «مدير النظام» always holds everything and can't be edited or deleted;
 * «مستخدم» can be edited but not deleted; added roles can be both. A role
 * granting more than the editor holds can't be touched either (403).
 */
export function RolesTable({ roles }: RolesTableProps) {
  const { user } = useAuthContext();
  const can = useCan();
  const deleteMutation = useDeleteRole();
  const [opened, setOpened] = useState<{ role: RoleResponse; readOnly: boolean } | null>(null);
  const [deleting, setDeleting] = useState<RoleResponse | null>(null);

  return (
    <>
      <Table>
        <TableCaption className="sr-only">الأدوار</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>الدور</TableHead>
            <TableHead>عدد الصلاحيات</TableHead>
            <TableHead className="text-end">الإجراءات</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {roles.length === 0 && (
            <TableRow>
              <TableCell colSpan={3} className="p-0">
                <EmptyState icon={ShieldCheck} title="لا توجد أدوار" />
              </TableCell>
            </TableRow>
          )}
          {roles.map((role) => {
            const beyondMe = exceedsPermissions(role.permissions, user?.permissions);
            const canEdit = can('ROLES', 'UPDATE') && role.builtIn !== 'ADMIN' && !beyondMe;
            const canRemove = can('ROLES', 'DELETE') && role.builtIn === null && !beyondMe;
            return (
              <TableRow key={role.id}>
                <TableCell className="font-medium">
                  {role.name}
                  {role.builtIn && (
                    <span className="ms-2 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                      مدمج
                    </span>
                  )}
                </TableCell>
                <TableCell className="tabular-nums">
                  {NUMBER_FORMAT.format(grantedCount(role))}
                </TableCell>
                <TableCell className="space-x-2 text-end rtl:space-x-reverse">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setOpened({ role, readOnly: !canEdit })}
                  >
                    {canEdit ? 'تعديل' : 'عرض'}
                  </Button>
                  {canRemove && (
                    <Button variant="ghost" size="sm" onClick={() => setDeleting(role)}>
                      حذف
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {opened && (
        <RoleFormDialog
          key={opened.role.id}
          role={opened.role}
          readOnly={opened.readOnly}
          open
          onOpenChange={(open) => !open && setOpened(null)}
        />
      )}

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="حذف الدور"
        message="لا يمكن حذف دور مسند لمستخدمين، ولا يمكن التراجع عن الحذف."
        itemLabel={deleting?.name}
        confirmLabel="حذف"
        isConfirming={deleteMutation.isPending}
        onConfirm={() =>
          deleting && deleteMutation.mutate(deleting.id, { onSettled: () => setDeleting(null) })
        }
      />
    </>
  );
}
