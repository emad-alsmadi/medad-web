import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { useReportTypesTree } from '@/hooks/report-types/use-report-types';
import { ReportTypeTree } from '@/components/report-types/report-type-tree';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ROUTES } from '@/constant/routes';

export function ReportTypesTreePage() {
  const { data, isPending, isError } = useReportTypesTree();

  return (
    <>
      <Helmet>
        <title>أنواع التقارير · عرض شجري</title>
      </Helmet>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>أنواع التقارير — عرض شجري</CardTitle>
          <Button variant="outline" size="sm" asChild>
            <Link to={ROUTES.reportTypes.list}>عرض القائمة</Link>
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {isPending && (
            <div className="space-y-2" aria-busy="true" aria-live="polite">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          )}

          {isError && (
            <p role="alert" className="text-sm text-destructive">
              فشل تحميل أنواع التقارير. يرجى المحاولة مرة أخرى.
            </p>
          )}

          {data && <ReportTypeTree nodes={data} />}
        </CardContent>
      </Card>
    </>
  );
}
