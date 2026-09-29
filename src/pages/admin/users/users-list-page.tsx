import { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Search, SearchX, TriangleAlert, UserPlus } from 'lucide-react';
import { useUsers } from '@/hooks/users/use-users';
import { useCan } from '@/hooks/auth/use-can';
import { useClientPagination } from '@/hooks/shared/use-client-pagination';
import { useDebouncedValue } from '@/hooks/shared/use-debounced-value';
import { matchesSearch } from '@/lib/utils/text';
import { UsersTable } from '@/components/admin/users/users-table';
import { CreateUserDialog } from '@/components/admin/users/create-user-dialog';
import { UsersTableSkeleton } from '@/components/admin/skeletons/users-table-skeleton';
import { EmptyState } from '@/components/shared/empty-state';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Pagination } from '@/components/ui/pagination';

/**
 * Route-level component: page -> hook -> lib/API -> react-query -> UI
 * kit. Pages never call lib/ or fetch directly. /users returns a plain
 * array (no paging or filter params exist for it), so it is searched and
 * paged client-side via useClientPagination.
 */
export function UsersListPage() {
  const { data, isPending, isError, refetch } = useUsers();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 300);
  const filtered = useMemo(
    () =>
      (data ?? []).filter(
        (u) =>
          matchesSearch(u.fullName, debouncedSearch) || matchesSearch(u.email, debouncedSearch),
      ),
    [data, debouncedSearch],
  );
  const { page, totalPages, pageItems, setPage } = useClientPagination(filtered);
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
          <div className="relative max-w-sm">
            <Search className="pointer-events-none absolute inset-y-0 end-3 my-auto h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              aria-label="بحث بالاسم أو البريد الإلكتروني"
              placeholder="بحث بالاسم أو البريد…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              className="pe-9"
            />
          </div>

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

          {!isError && data && filtered.length === 0 && debouncedSearch.trim() && (
            <EmptyState icon={SearchX} title="لا يوجد مستخدمون مطابقون" />
          )}

          {!isError && (filtered.length > 0 || !debouncedSearch.trim()) && (
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
