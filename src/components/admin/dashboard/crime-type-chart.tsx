import { useNavigate } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { StatisticItem } from '@/types/report-statistics';

const NUMBER_FORMAT = new Intl.NumberFormat('ar-SY-u-nu-latn');
const TOP_CRIME_TYPES = 5;

/** Same categorical palette as the distribution donut, so a crime type reads as the same color everywhere. */
const SERIES_COLORS = ['#00907a', '#bf8a10', '#c23b52', '#3f7fd0', '#e0703a', '#9a6bd0'];
/** «بدون جرم» is not a category of its own, so it stays neutral. */
const UNSPECIFIED_COLOR = 'var(--color-text-muted)';

const CHART_HEIGHT = 420;

interface CrimeTypeChartProps {
  items: StatisticItem<number>[];
  hrefFor: (item: StatisticItem<number>) => string | undefined;
}

/** Truncates a long crime-type label so the axis stays readable; full text is still in the tooltip. */
function truncate(label: string, max = 12): string {
  return label.length > max ? `${label.slice(0, max - 1)}…` : label;
}

/**
 * The top crime types by count as columns, one color per category from
 * the shared palette. The full breakdown (every crime type) lives in
 * the register table further down the page — this is just the highlights.
 * Clicking a bar goes to that crime type's reports.
 */
export function CrimeTypeChart({ items, hrefFor }: CrimeTypeChartProps) {
  const navigate = useNavigate();

  const data = items
    .filter((item) => item.count > 0 && item.key !== null)
    .sort((a, b) => b.count - a.count)
    .slice(0, TOP_CRIME_TYPES)
    .map((item, index) => ({
      key: item.key,
      label: truncate(item.label),
      fullLabel: item.label,
      count: item.count,
      href: hrefFor(item),
      color: item.key === null ? UNSPECIFIED_COLOR : SERIES_COLORS[index % SERIES_COLORS.length]!,
    }));

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>أحدث الضبوط حسب نوع الجرم</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">لا توجد بيانات كافية</p>
        ) : (
          <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
            <BarChart data={data} margin={{ left: -12, right: 12, top: 8 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--color-border-subtle)"
                vertical={false}
              />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} tickLine={false} interval={0} />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 12 }}
                width={32}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                cursor={{ fill: 'var(--color-border-subtle)', opacity: 0.5, radius: 6 }}
                contentStyle={{
                  direction: 'rtl',
                  borderRadius: 8,
                  border: '1px solid var(--color-border-subtle)',
                  fontSize: 13,
                }}
                formatter={(value) => [NUMBER_FORMAT.format(Number(value)), 'عدد الضبوط']}
                labelFormatter={(_, payload) =>
                  (payload?.[0]?.payload as { fullLabel?: string } | undefined)?.fullLabel ?? ''
                }
              />
              <Bar
                dataKey="count"
                radius={[6, 6, 0, 0]}
                maxBarSize={56}
                isAnimationActive
                animationDuration={900}
                animationEasing="ease-out"
                className="cursor-pointer"
                onClick={(entry) => {
                  const href = (entry as unknown as { href?: string }).href;
                  if (href) void navigate(href);
                }}
              >
                {data.map((entry) => (
                  <Cell key={String(entry.key)} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
