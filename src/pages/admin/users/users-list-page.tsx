import { Helmet } from 'react-helmet-async';
import { useUsers } from '@/hooks/users/use-users';
import { UsersTable } from '@/components/admin/users/users-table';
import { UsersTableSkeleton } from '@/components/admin/skeletons/users-table-skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * Route-level component: page -> hook -> lib/API -> react-query -> UI
 * kit. Pages never call lib/ or fetch directly. /users is a plain array
 * (no pagination), so there's no page-controls UI here.
 */
export function UsersListPage() {
  const { data, isPending, isError } = useUsers();

  return (
    <>
      <Helmet>
        <title>المستخدمون · الإدارة</title>
      </Helmet>
      <Card>
        <CardHeader>
          <CardTitle>المستخدمون</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isPending && <UsersTableSkeleton />}

          {isError && (
            <p role="alert" className="text-sm text-destructive">
              فشل تحميل المستخدمين. يرجى المحاولة مرة أخرى.
            </p>
          )}

          {data && <UsersTable users={data} />}
        </CardContent>
      </Card>
    </>
  );
}
