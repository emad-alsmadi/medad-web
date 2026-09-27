import { CircleCheck, FileText, Lock, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { StatCard } from '@/components/admin/dashboard/stat-card';
import { StatisticBreakdown } from '@/components/admin/dashboard/statistic-breakdown';
import { CrimeTypeChart } from '@/components/admin/dashboard/crime-type-chart';
import { CrimeStatisticsTable } from '@/components/admin/dashboard/crime-statistics-table';
import { ReportsDistributionChart } from '@/components/admin/dashboard/reports-distribution-chart';
import { AnimatedNumber } from '@/components/shared/animated-number';
import { ROUTES } from '@/constant/routes';
import { riseIn, staggerChildren } from '@/motion/variants';
import type { ReportResult } from '@/types/report';
import type {
  ReportStatisticsResponse,
  StatisticItem,
  StatisticsRange,
} from '@/types/report-statistics';

const NUMBER_FORMAT = new Intl.NumberFormat('ar-SY-u-nu-latn');
const FORM_TYPES_SHOWN = 8;

interface ReportStatisticsPanelProps {
  stats: ReportStatisticsResponse;
  range: StatisticsRange;
  resultLabel: (result: ReportResult) => string;
}

function countOf<K>(items: StatisticItem<K>[], key: K): number {
  return items.find((item) => item.key === key)?.count ?? 0;
}

/**
 * GET /reports/statistics for the chosen period: headline counts, each
 * breakdown as a ranked bar list, and the crime × discovery × result
 * table. Every row whose key is a list filter links to those reports,
 * keeping the same period.
 */
export function ReportStatisticsPanel({ stats, range, resultLabel }: ReportStatisticsPanelProps) {
  /** The reports list filtered to one breakdown row, for the same period; undefined for a null key. */
  function linkTo(param: string) {
    return <K,>(item: StatisticItem<K>) => {
      if (item.key === null) return undefined;
      const search = new URLSearchParams({ [param]: String(item.key) });
      if (range.from) search.set('from', range.from);
      if (range.to) search.set('to', range.to);
      return `${ROUTES.reports.list}?${search.toString()}`;
    };
  }

  const open =
    countOf(stats.byResult, 'UNDER_INVESTIGATION') +
    countOf(stats.byResult, 'FURTHER_INVESTIGATION');
  const closed = countOf(stats.byResult, 'CLOSED');
  const discovered = countOf(stats.byDiscovered, true);
  const discoveredShare = stats.total > 0 ? Math.round((discovered / stats.total) * 100) : 0;

  return (
    <motion.div className="space-y-4" initial="hidden" animate="visible" variants={staggerChildren}>
      <motion.div
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
        variants={staggerChildren}
      >
        <StatCard
          label="ضبوط الفترة"
          value={<AnimatedNumber value={stats.total} format={NUMBER_FORMAT} />}
          icon={<FileText />}
          accent="forest"
        />
        <StatCard
          label="قيد التحقيق أو استكماله"
          value={<AnimatedNumber value={open} format={NUMBER_FORMAT} />}
          icon={<Search />}
          accent="gold"
        />
        <StatCard
          label={resultLabel('CLOSED')}
          value={<AnimatedNumber value={closed} format={NUMBER_FORMAT} />}
          icon={<Lock />}
          accent="umber"
        />
        <StatCard
          label="مكتشف"
          value={<AnimatedNumber value={discovered} format={NUMBER_FORMAT} />}
          hint={
            <>
              <AnimatedNumber value={discoveredShare} format={NUMBER_FORMAT} suffix="%" /> من ضبوط
              الفترة
            </>
          }
          icon={<CircleCheck />}
          accent="forest"
        />
      </motion.div>

      <motion.div variants={riseIn} className="grid grid-cols-1 gap-4 xl:grid-cols-5">
        <div className="xl:col-span-3">
          <ReportsDistributionChart
            total={stats.total}
            breakdowns={[
              {
                value: 'type',
                label: 'حسب نوع الضبط',
                items: stats.byType,
                hrefFor: linkTo('type'),
              },
              {
                value: 'result',
                label: 'حسب النتيجة',
                items: stats.byResult,
                hrefFor: linkTo('result'),
              },
              { value: 'discovered', label: 'حسب الاكتشاف', items: stats.byDiscovered },
            ]}
          />
        </div>
        <div className="xl:col-span-2">
          <StatisticBreakdown
            title="أكثر نماذج الضبوط"
            items={stats.byFormType}
            total={stats.total}
            hrefFor={linkTo('formTypeId')}
            limit={FORM_TYPES_SHOWN}
          />
        </div>
      </motion.div>

      <motion.div variants={riseIn}>
        <CrimeTypeChart items={stats.byCrimeType} hrefFor={linkTo('crimeTypeId')} />
      </motion.div>

      <motion.div variants={riseIn}>
        <CrimeStatisticsTable
          items={stats.byCrimeType}
          resultLabel={resultLabel}
          hrefFor={linkTo('crimeTypeId')}
        />
      </motion.div>
    </motion.div>
  );
}
