import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useAdminUsers } from '@/hooks/admin/users/use-admin-users';
import { UsersTable } from '@/components/admin/users/users-table';
import { UsersTableSkeleton } from '@/components/admin/skeletons/users-table-skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

/**
 * Route-level component: page -> hook -> lib/API -> react-query -> UI
 * kit. Pages never call lib/ or fetch directly.
 */
export function UsersListPage() {
  const [page, setPage] = useState(1);
  const { data, isPending, isError, isFetching } = useAdminUsers({ page, pageSize: 20 });

  return (
    <>
      <Helmet>
        <title>Users · Admin</title>
      </Helmet>
      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isPending && <UsersTableSkeleton />}

          {isError && (
            <p role="alert" className="text-sm text-destructive">
              Failed to load users. Please try again.
            </p>
          )}

          {data && <UsersTable users={data.items} />}

          {data && (
            <div className="flex items-center justify-between pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || isFetching}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {data.page} of {data.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                disabled={page >= data.totalPages || isFetching}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
