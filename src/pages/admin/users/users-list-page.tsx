import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { TriangleAlert, UserPlus } from 'lucide-react';
import { useUsers } from '@/hooks/users/use-users';
import { useCan } from '@/hooks/auth/use-can';
import { useClientPagination } from '@/hooks/shared/use-client-pagination';
import { UsersTable } from '@/components/admin/users/users-table';
import { CreateUserDialog } from '@/components/admin/users/create-user-dialog';
import { UsersTableSkeleton } from '@/components/admin/skeletons/users-table-skeleton';
import { EmptyState } from '@/components/shared/empty-state';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Pagination } from '@/components/ui/pagination';

/**
 * Route-level component: page -> hook -> lib/API -> react-query -> UI
 * kit. Pages never call lib/ or fetch directly. /users returns a plain
 * array (no paging or filter params exist for it), so pages are sliced
 * client-side via useClientPagination.
 */
export function UsersListPage() {
  const { data, isPending, isError, refetch } = useUsers();
  const { page, totalPages, pageItems, setPage } = useClientPagination(data ?? []);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const canCreate = useCan()('USERS', 'CREATE');

  return (
    <>
      <Helmet>
        <title>المستخدمون · الإدارة</title>
      </Helmet>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>المستخدمون</CardTitle>
          {canCreate && (
            <Button size="sm" onClick={() => setIsCreateOpen(true)}>
              <UserPlus />
              <span>مستخدم جديد</span>
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {isPending && <UsersTableSkeleton />}

          {isError && (
            <EmptyState
              icon={TriangleAlert}
              variant="destructive"
              title="فشل تحميل المستخدمين"
              description="حدث خطأ أثناء تحميل البيانات. يرجى المحاولة مرة أخرى."
              action={{ label: 'إعادة المحاولة', onClick: () => void refetch() }}
            />
          )}

          {!isError && (
            <>
              <UsersTable users={pageItems} />
              <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
            </>
          )}
        </CardContent>
      </Card>

      {canCreate && <CreateUserDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />}
    </>
  );
}
