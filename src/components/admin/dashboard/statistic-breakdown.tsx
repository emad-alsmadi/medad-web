import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EASE_OUT } from '@/motion/variants';
import type { StatisticItem } from '@/types/report-statistics';

const NUMBER_FORMAT = new Intl.NumberFormat('ar-SY-u-nu-latn');

interface StatisticBreakdownProps<K> {
  title: string;
  items: StatisticItem<K>[];
  /** Sum of the breakdown, for the share shown next to each count. */
  total: number;
  /** Where a row leads (its reports in the list), or undefined when it can't be filtered. */
  hrefFor?: (item: StatisticItem<K>) => string | undefined;
  /** Caps a long breakdown (e.g. form types); zero rows are dropped first. */
  limit?: number;
}

/**
 * One statistics breakdown as a ranked list of thin horizontal bars —
 * a single series, so a single hue; counts stay in text ink beside the
 * bar. Each row links to the matching reports when the list can filter
 * by its key.
 */
export function StatisticBreakdown<K>({
  title,
  items,
  total,
  hrefFor,
  limit,
}: StatisticBreakdownProps<K>) {
  const shown = limit ? items.filter((item) => item.count > 0).slice(0, limit) : items;
  const hidden = limit ? items.filter((item) => item.count > 0).length - shown.length : 0;
  const max = Math.max(1, ...shown.map((item) => item.count));

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {shown.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            لا توجد ضبوط في هذه الفترة
          </p>
        ) : (
          <ul className="space-y-1">
            {shown.map((item, index) => {
              const share = total > 0 ? Math.round((item.count / total) * 100) : 0;
              const href = hrefFor?.(item);
              const content = (
                <>
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="truncate">{item.label}</span>
                    <span className="shrink-0 tabular-nums">
                      <span className="font-semibold">{NUMBER_FORMAT.format(item.count)}</span>
                      <span className="ms-1.5 text-xs text-muted-foreground">
                        {NUMBER_FORMAT.format(share)}%
                      </span>
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 rounded-full bg-muted" aria-hidden="true">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-l from-syid-forest to-syid-forest-dark"
                      initial={{ width: 0 }}
                      animate={{ width: `${(item.count / max) * 100}%` }}
                      transition={{ duration: 0.7, delay: 0.1 + index * 0.05, ease: EASE_OUT }}
                    />
                  </div>
                </>
              );
              return (
                <li key={String(item.key)}>
                  {href ? (
                    <Link
                      to={href}
                      className="block rounded-lg px-2 py-1.5 transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                      title={`عرض ضبوط «${item.label}»`}
                    >
                      {content}
                    </Link>
                  ) : (
                    <div className="px-2 py-1.5">{content}</div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
        {hidden > 0 && (
          <p className="mt-2 px-2 text-xs text-muted-foreground">
            و{NUMBER_FORMAT.format(hidden)} أخرى أقل عددًا
          </p>
        )}
      </CardContent>
    </Card>
  );
}
