import { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { MotionConfig, motion } from 'framer-motion';
import { FileText, FolderTree, TrendingUp, TriangleAlert, Users } from 'lucide-react';
import { useReports } from '@/hooks/reports/use-reports';
import { useReportStatistics } from '@/hooks/reports/use-report-statistics';
import { useReportOptions } from '@/hooks/reports/use-report-options';
import { useFormTypes } from '@/hooks/form-types/use-form-types';
import { useUsers } from '@/hooks/users/use-users';
import { StatCard } from '@/components/admin/dashboard/stat-card';
import {
  ReportsTrendChart,
  type MonthCount,
} from '@/components/admin/dashboard/reports-trend-chart';
import { RecentReportsTable } from '@/components/admin/dashboard/recent-reports-table';
import { DashboardSkeleton } from '@/components/admin/dashboard/dashboard-skeleton';
import { ReportStatisticsPanel } from '@/components/admin/dashboard/report-statistics-panel';
import { StatisticsRangePicker } from '@/components/admin/dashboard/statistics-range-picker';
import { EmptyState } from '@/components/shared/empty-state';
import { AnimatedNumber } from '@/components/shared/animated-number';
import { riseIn, staggerChildren } from '@/motion/variants';
import { Skeleton } from '@/components/ui/skeleton';
import { isSelectableFormType } from '@/types/form-type';
import type { StatisticsRange } from '@/types/report-statistics';

const TREND_MONTHS = 6;
const RECENT_REPORTS_COUNT = 8;

const MONTH_LABEL_FORMAT = new Intl.DateTimeFormat('ar-SY-u-nu-latn', {
  month: 'short',
  year: '2-digit',
});

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
  const formTypesQuery = useFormTypes();
  const usersQuery = useUsers();

  const [statsRange, setStatsRange] = useState<StatisticsRange>({});
  const statsQuery = useReportStatistics(statsRange);
  const { labels } = useReportOptions();

  const isPending = reportsQuery.isPending || formTypesQuery.isPending || usersQuery.isPending;
  const isError = reportsQuery.isError || formTypesQuery.isError || usersQuery.isError;

  const refetchAll = () => {
    void reportsQuery.refetch();
    void formTypesQuery.refetch();
    void usersQuery.refetch();
  };

  const reportsData = reportsQuery.data?.content;
  const reports = useMemo(() => reportsData ?? [], [reportsData]);
  const totalReports = reportsQuery.data?.totalElements ?? 0;
  const totalFormTypes = (formTypesQuery.data ?? []).filter(isSelectableFormType).length;
  const totalUsers = usersQuery.data?.length ?? 0;

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

      <MotionConfig reducedMotion="user">
        <motion.div
          className="space-y-6"
          initial="hidden"
          animate="visible"
          variants={staggerChildren}
        >
          <motion.div variants={riseIn}>
            <h1 className="text-xl font-bold">نظرة عامة</h1>
            <p className="text-sm text-muted-foreground">
              ملخص عام لحالة النظام: الضبوط، النماذج، والمستخدمون.
            </p>
          </motion.div>

          {isPending && <DashboardSkeleton />}

          {isError && (
            <EmptyState
              icon={TriangleAlert}
              variant="destructive"
              title="فشل تحميل بيانات لوحة التحكم"
              description="حدث خطأ أثناء تحميل البيانات. يرجى المحاولة مرة أخرى."
              action={{ label: 'إعادة المحاولة', onClick: refetchAll }}
            />
          )}

          {!isPending && !isError && (
            <>
              <motion.div
                className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
                initial="hidden"
                animate="visible"
                variants={staggerChildren}
              >
                <StatCard
                  label="إجمالي الضبوط"
                  value={<AnimatedNumber value={totalReports} />}
                  icon={<FileText />}
                  accent="forest"
                />
                <StatCard
                  label="ضبوط هذا الشهر"
                  value={<AnimatedNumber value={reportsThisMonth} />}
                  icon={<TrendingUp />}
                  accent="gold"
                />
                <StatCard
                  label="نماذج الضبوط"
                  value={<AnimatedNumber value={totalFormTypes} />}
                  icon={<FolderTree />}
                  accent="umber"
                />
                <StatCard
                  label="المستخدمون"
                  value={<AnimatedNumber value={totalUsers} />}
                  icon={<Users />}
                  accent="forest"
                />
              </motion.div>

              <motion.div
                className="grid grid-cols-1 gap-4 lg:grid-cols-2"
                initial="hidden"
                animate="visible"
                variants={riseIn}
              >
                <ReportsTrendChart data={trend} />
                <RecentReportsTable reports={recentReports} />
              </motion.div>
            </>
          )}

          <motion.section
            className="space-y-4"
            aria-labelledby="statistics-heading"
            variants={riseIn}
          >
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 id="statistics-heading" className="text-lg font-bold">
                  الإحصائيات
                </h2>
                <p className="text-sm text-muted-foreground">
                  حسب تاريخ الضبط. اضغط أي خانة لعرض ضبوطها.
                </p>
              </div>
              <StatisticsRangePicker value={statsRange} onChange={setStatsRange} />
            </div>

            {statsQuery.isPending && (
              <div className="space-y-4" aria-busy="true" aria-live="polite">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-64 w-full" />
              </div>
            )}

            {statsQuery.isError && (
              <EmptyState
                icon={TriangleAlert}
                variant="destructive"
                title="فشل تحميل الإحصائيات"
                description="تأكد من أن تاريخ البداية لا يأتي بعد تاريخ النهاية، ثم أعد المحاولة."
                action={{ label: 'إعادة المحاولة', onClick: () => void statsQuery.refetch() }}
              />
            )}

            {statsQuery.data && !statsQuery.isError && (
              <ReportStatisticsPanel
                stats={statsQuery.data}
                range={statsRange}
                resultLabel={labels.result}
              />
            )}
          </motion.section>
        </motion.div>
      </MotionConfig>
    </>
  );
}
