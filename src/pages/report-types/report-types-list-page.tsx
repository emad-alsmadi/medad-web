import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { useReportTypes } from '@/hooks/report-types/use-report-types';
import { useAuthContext } from '@/contexts/auth-context';
import { ReportTypeTable } from '@/components/report-types/report-type-table';
import { ReportTypeForm } from '@/components/report-types/report-type-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ROUTES } from '@/constant/routes';

export function ReportTypesListPage() {
  const { data, isPending, isError } = useReportTypes();
  const { user } = useAuthContext();
  const canManage = user?.role === 'ADMIN';
  const [creating, setCreating] = useState(false);

  return (
    <>
      <Helmet>
        <title>أنواع التقارير</title>
      </Helmet>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>أنواع التقارير</CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link to={ROUTES.reportTypes.tree}>عرض شجري</Link>
            </Button>
            {canManage && (
              <Button size="sm" onClick={() => setCreating(true)}>
                نوع جديد
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isPending && (
            <div className="space-y-2" aria-busy="true" aria-live="polite">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          )}

          {isError && (
            <p role="alert" className="text-sm text-destructive">
              فشل تحميل أنواع التقارير. يرجى المحاولة مرة أخرى.
            </p>
          )}

          {data && <ReportTypeTable types={data} canManage={canManage} />}
        </CardContent>
      </Card>

      {creating && <ReportTypeForm open onOpenChange={setCreating} />}
    </>
  );
}
