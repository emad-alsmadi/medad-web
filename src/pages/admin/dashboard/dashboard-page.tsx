import { useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { FileText, FolderTree, TrendingUp, Users } from 'lucide-react';
import { useReports } from '@/hooks/reports/use-reports';
import { useReportTypes } from '@/hooks/report-types/use-report-types';
import { useUsers } from '@/hooks/users/use-users';
import { StatCard } from '@/components/admin/dashboard/stat-card';
import { ReportsByTypeChart, type TypeCount } from '@/components/admin/dashboard/reports-by-type-chart';
import { ReportsTrendChart, type MonthCount } from '@/components/admin/dashboard/reports-trend-chart';
import { RecentReportsTable } from '@/components/admin/dashboard/recent-reports-table';
import { DashboardSkeleton } from '@/components/admin/dashboard/dashboard-skeleton';

const TREND_MONTHS = 6;
const RECENT_REPORTS_COUNT = 8;
const TOP_TYPES_COUNT = 6;

const MONTH_LABEL_FORMAT = new Intl.DateTimeFormat('ar-SY', { month: 'short', year: '2-digit' });

function buildLastMonths(count: number): { key: string; label: string }[] {
  const months: { key: string; label: string }[] = [];
  const now = new Date();
  for (let i = count - 1; i >= 0; i -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    months.push({ key, label: MONTH_LABEL_FORMAT.format(date) });
  }
  return months;
}

export function DashboardPage() {
  const reportsQuery = useReports({ size: 500, sort: 'reportDate,desc' });
  const reportTypesQuery = useReportTypes();
  const usersQuery = useUsers();

  const isPending = reportsQuery.isPending || reportTypesQuery.isPending || usersQuery.isPending;
  const isError = reportsQuery.isError || reportTypesQuery.isError || usersQuery.isError;

  const reportsData = reportsQuery.data?.content;
  const reports = useMemo(() => reportsData ?? [], [reportsData]);
  const totalReports = reportsQuery.data?.totalElements ?? 0;
  const totalTypes = reportTypesQuery.data?.length ?? 0;
  const totalUsers = usersQuery.data?.length ?? 0;

  const typeCounts = useMemo<TypeCount[]>(() => {
    const counts = new Map<string, number>();
    for (const report of reports) {
      const name = report.reportType.name;
      counts.set(name, (counts.get(name) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, TOP_TYPES_COUNT);
  }, [reports]);

  const trend = useMemo<MonthCount[]>(() => {
    const months = buildLastMonths(TREND_MONTHS);
    const counts = new Map(months.map((month) => [month.key, 0]));
    for (const report of reports) {
      const key = report.reportDate?.slice(0, 7);
      if (key && counts.has(key)) {
        counts.set(key, (counts.get(key) ?? 0) + 1);
      }
    }
    return months.map((month) => ({ month: month.label, count: counts.get(month.key) ?? 0 }));
  }, [reports]);

  const reportsThisMonth = useMemo(() => {
    const now = new Date();
    const currentKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    return reports.filter((report) => report.reportDate?.slice(0, 7) === currentKey).length;
  }, [reports]);

  const recentReports = useMemo(() => reports.slice(0, RECENT_REPORTS_COUNT), [reports]);

  return (
    <>
      <Helmet>
        <title>نظرة عامة · الإدارة</title>
      </Helmet>

      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold">نظرة عامة</h1>
          <p className="text-sm text-muted-foreground">
            ملخص عام لحالة النظام: الضبوط، الأنواع، والمستخدمون.
          </p>
        </div>

        {isPending && <DashboardSkeleton />}

        {isError && (
          <p role="alert" className="text-sm text-destructive">
            فشل تحميل بيانات لوحة التحكم. يرجى المحاولة مرة أخرى.
          </p>
        )}

        {!isPending && !isError && (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                label="إجمالي الضبوط"
                value={totalReports.toLocaleString('ar-SY')}
                icon={<FileText />}
                accent="forest"
              />
              <StatCard
                label="ضبوط هذا الشهر"
                value={reportsThisMonth.toLocaleString('ar-SY')}
                icon={<TrendingUp />}
                accent="gold"
              />
              <StatCard
                label="أنواع الضبوط"
                value={totalTypes.toLocaleString('ar-SY')}
                icon={<FolderTree />}
                accent="umber"
              />
              <StatCard
                label="المستخدمون"
                value={totalUsers.toLocaleString('ar-SY')}
                icon={<Users />}
                accent="forest"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <ReportsTrendChart data={trend} />
              <ReportsByTypeChart data={typeCounts} />
            </div>

            <RecentReportsTable reports={recentReports} />
          </>
        )}
      </div>
    </>
  );
}
