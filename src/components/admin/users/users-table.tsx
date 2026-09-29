import { useState } from 'react';
import { FileText, MoreVertical, ShieldCheck, Trash2, Users } from 'lucide-react';
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
import { Switch } from '@/components/ui/switch';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { EmptyState } from '@/components/shared/empty-state';
import { ReportInfoDialog } from '@/components/admin/users/report-info-dialog';
import { DeleteUserDialog } from '@/components/admin/users/delete-user-dialog';
import { ChangeRoleDialog } from '@/components/admin/users/change-role-dialog';
import { useAuthContext } from '@/contexts/auth-context';
import { useCan } from '@/hooks/auth/use-can';
import { useSetUserEnabled } from '@/hooks/users/use-set-user-enabled';
import { roleLabel } from '@/lib/auth/permissions';
import type { UserResponse } from '@/types/user';

interface UsersTableProps {
  users: UserResponse[];
}

/**
 * Presentational shell + local dialog-open state only — mutations
 * themselves live in the dialogs via hooks/users. Each action shows only
 * with its permission, and none on the signed-in user's own row:
 * disabling, deleting or demoting yourself would cut your own access.
 */
export function UsersTable({ users }: UsersTableProps) {
  const { user: me } = useAuthContext();
  const can = useCan();
  const canUpdate = can('USERS', 'UPDATE');
  const canDelete = can('USERS', 'DELETE');
  const canChangeRole = canUpdate && can('ROLES', 'VIEW');
  const enabledMutation = useSetUserEnabled();
  const [reportInfoUser, setReportInfoUser] = useState<UserResponse | null>(null);
  const [roleUser, setRoleUser] = useState<UserResponse | null>(null);
  const [deleteUser, setDeleteUser] = useState<UserResponse | null>(null);
  const [disablingUser, setDisablingUser] = useState<UserResponse | null>(null);

  return (
    <>
      <Table>
        <TableCaption className="sr-only">قائمة المستخدمين</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>الاسم</TableHead>
            <TableHead>البريد الإلكتروني</TableHead>
            <TableHead>الدور</TableHead>
            <TableHead>الحالة</TableHead>
            <TableHead>بيانات الضبط</TableHead>
            <TableHead className="text-end">الإجراءات</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="p-0">
                <EmptyState icon={Users} title="لا يوجد مستخدمون" />
              </TableCell>
            </TableRow>
          )}
          {users.map((user) => {
            const isSelf = user.id === me?.id;
            const statusId = `user-status-${user.id}`;
            const hasActions = !isSelf && (canUpdate || canDelete);
            return (
              <TableRow key={user.id}>
                <TableCell>
                  {user.fullName}
                  {isSelf && <span className="ms-1.5 text-xs text-muted-foreground">(أنت)</span>}
                </TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{roleLabel(user.role)}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {canUpdate && !isSelf && (
                      <Switch
                        checked={user.enabled}
                        aria-labelledby={statusId}
                        disabled={enabledMutation.isPending}
                        // Disabling cuts the user off at once, so it's confirmed; enabling isn't.
                        onCheckedChange={(enabled) =>
                          enabled
                            ? enabledMutation.mutate({ id: user.id, enabled })
                            : setDisablingUser(user)
                        }
                      />
                    )}
                    <span
                      id={statusId}
                      className={user.enabled ? undefined : 'text-muted-foreground'}
                    >
                      {user.enabled ? 'مفعّل' : 'معطّل'}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  {canUpdate && !isSelf ? (
                    <Button
                      variant="link"
                      size="sm"
                      className="h-auto p-0"
                      onClick={() => setReportInfoUser(user)}
                    >
                      {user.reportInfo ? 'تعديل' : 'غير محدد'}
                    </Button>
                  ) : (
                    <span className="text-muted-foreground">
                      {user.reportInfo ? 'محددة' : 'غير محدد'}
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-end">
                  {hasActions && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label="إجراءات المستخدم">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {canChangeRole && (
                          <DropdownMenuItem onSelect={() => setRoleUser(user)}>
                            <ShieldCheck />
                            <span>تغيير الدور</span>
                          </DropdownMenuItem>
                        )}
                        {canUpdate && (
                          <DropdownMenuItem onSelect={() => setReportInfoUser(user)}>
                            <FileText />
                            <span>بيانات الضبط</span>
                          </DropdownMenuItem>
                        )}
                        {canDelete && (
                          <DropdownMenuItem
                            variant="destructive"
                            onSelect={() => setDeleteUser(user)}
                          >
                            <Trash2 />
                            <span>حذف</span>
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {reportInfoUser && (
        <ReportInfoDialog
          user={reportInfoUser}
          open
          onOpenChange={(open) => !open && setReportInfoUser(null)}
        />
      )}
      {roleUser && (
        <ChangeRoleDialog
          user={roleUser}
          open
          onOpenChange={(open) => !open && setRoleUser(null)}
        />
      )}
      <ConfirmDialog
        open={disablingUser !== null}
        onOpenChange={(open) => !open && setDisablingUser(null)}
        title="تعطيل الحساب"
        message="سيتوقف وصول هذا المستخدم فورًا وتنتهي جلساته، حتى يُعاد تفعيل حسابه."
        itemLabel={disablingUser?.fullName}
        confirmLabel="تعطيل"
        isConfirming={enabledMutation.isPending}
        onConfirm={() =>
          disablingUser &&
          enabledMutation.mutate(
            { id: disablingUser.id, enabled: false },
            { onSettled: () => setDisablingUser(null) },
          )
        }
      />
      {deleteUser && (
        <DeleteUserDialog
          user={deleteUser}
          open
          onOpenChange={(open) => !open && setDeleteUser(null)}
        />
      )}
    </>
  );
}
