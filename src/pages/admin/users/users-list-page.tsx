import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { UserPlus } from 'lucide-react';
import { useUsers } from '@/hooks/users/use-users';
import { useClientPagination } from '@/hooks/shared/use-client-pagination';
import { UsersTable } from '@/components/admin/users/users-table';
import { CreateUserDialog } from '@/components/admin/users/create-user-dialog';
import { UsersTableSkeleton } from '@/components/admin/skeletons/users-table-skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Pagination } from '@/components/ui/pagination';

/**
 * Route-level component: page -> hook -> lib/API -> react-query -> UI
 * kit. Pages never call lib/ or fetch directly. /users is a plain array
 * with no server-side pagination, so pages are sliced client-side via
 * useClientPagination instead.
 */
export function UsersListPage() {
  const { data, isPending, isError } = useUsers();
  const { page, totalPages, pageItems, setPage } = useClientPagination(data ?? []);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  return (
    <>
      <Helmet>
        <title>المستخدمون · الإدارة</title>
      </Helmet>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>المستخدمون</CardTitle>
          <Button size="sm" onClick={() => setIsCreateOpen(true)}>
            <UserPlus />
            <span>مستخدم جديد</span>
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {isPending && <UsersTableSkeleton />}

          {isError && (
            <p role="alert" className="text-sm text-destructive">
              فشل تحميل المستخدمين. يرجى المحاولة مرة أخرى.
            </p>
          )}

          {data && (
            <>
              <UsersTable users={pageItems} />
              <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
            </>
          )}
        </CardContent>
      </Card>

      <CreateUserDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />
    </>
  );
}
