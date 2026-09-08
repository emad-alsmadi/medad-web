import { useState } from 'react';
import { FileText, MoreVertical, Trash2 } from 'lucide-react';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ReportInfoDialog } from '@/components/admin/users/report-info-dialog';
import { DeleteUserDialog } from '@/components/admin/users/delete-user-dialog';
import type { UserResponse } from '@/types/user';

const ROLE_LABELS: Record<UserResponse['role'], string> = {
  ADMIN: 'مسؤول',
  USER: 'مستخدم',
};

interface UsersTableProps {
  users: UserResponse[];
}

/**
 * Presentational shell + local dialog-open state only — mutations
 * themselves live in the dialogs via hooks/users. Consumed by
 * pages/admin/users.
 */
export function UsersTable({ users }: UsersTableProps) {
  const [reportInfoUser, setReportInfoUser] = useState<UserResponse | null>(null);
  const [deleteUser, setDeleteUser] = useState<UserResponse | null>(null);

  if (users.length === 0) {
    return <p className="text-sm text-muted-foreground">لا يوجد مستخدمون.</p>;
  }

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
            <TableHead>بيانات التقرير</TableHead>
            <TableHead className="text-end">الإجراءات</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell>{user.fullName}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>{ROLE_LABELS[user.role]}</TableCell>
              <TableCell>{user.enabled ? 'نشط' : 'غير نشط'}</TableCell>
              <TableCell>
                <Button
                  variant="link"
                  size="sm"
                  className="h-auto p-0"
                  onClick={() => setReportInfoUser(user)}
                >
                  {user.reportInfo ? 'تعديل' : 'غير محدد'}
                </Button>
              </TableCell>
              <TableCell className="text-end">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" aria-label="إجراءات المستخدم">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={() => setReportInfoUser(user)}>
                      <FileText />
                      <span>بيانات التقرير</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem variant="destructive" onSelect={() => setDeleteUser(user)}>
                      <Trash2 />
                      <span>حذف</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {reportInfoUser && (
        <ReportInfoDialog
          user={reportInfoUser}
          open
          onOpenChange={(open) => !open && setReportInfoUser(null)}
        />
      )}
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
