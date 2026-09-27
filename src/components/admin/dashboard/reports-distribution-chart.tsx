import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Info } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AnimatedNumber } from '@/components/shared/animated-number';
import { useDrawProgress } from '@/hooks/shared/use-animated-number';
import { EASE_OUT } from '@/motion/variants';
import { SegmentedTabs } from '@/components/ui/segmented-tabs';
import { cn } from '@/lib/utils/cn';
import type { StatisticItem } from '@/types/report-statistics';

const NUMBER_FORMAT = new Intl.NumberFormat('ar-SY-u-nu-latn');
const ID_PREFIX = 'reports-distribution';

/**
 * Categorical slots, fixed order, brand-derived (forest, gold, umber first).
 * Validated as a ring (last slot next to the first) for 2–6 slices on the
 * white card and the dark forest card: CVD ΔE ≥ 8 except 3 slices (floor
 * band, carried by the legend labels), normal-vision ΔE ≥ 15.
 */
const SERIES_COLORS = ['#00907a', '#bf8a10', '#c23b52', '#3f7fd0', '#e0703a', '#9a6bd0'];
/** «غير محدد» is not a category of its own, so it stays neutral. */
const UNSPECIFIED_COLOR = 'var(--color-text-muted)';

const SIZE = 200;
const CENTER = SIZE / 2;
const OUTER_RADIUS = 88;
const INNER_RADIUS = 62;
/** How much the hovered slice grows, as a scale about the ring's centre. */
const ACTIVE_SCALE = 1.06;

export interface DistributionBreakdown {
  value: string;
  label: string;
  items: StatisticItem<unknown>[];
  /** Where a row leads (its reports in the list), or undefined when it can't be filtered. */
  hrefFor?: (item: StatisticItem<unknown>) => string | undefined;
}

interface ReportsDistributionChartProps {
  breakdowns: DistributionBreakdown[];
  /** Sum of every breakdown. */
  total: number;
}

interface Slice {
  item: StatisticItem<unknown>;
  color: string;
  share: number;
  href?: string;
  start: number;
  end: number;
}

function point(angle: number, radius: number): string {
  return `${CENTER + radius * Math.cos(angle)} ${CENTER + radius * Math.sin(angle)}`;
}

/** An annular sector, angles in radians clockwise from 12 o'clock. */
function sectorPath(start: number, end: number, outer: number, inner: number): string {
  const a0 = start - Math.PI / 2;
  const a1 = end - Math.PI / 2;
  const large = end - start > Math.PI ? 1 : 0;
  return [
    `M ${point(a0, outer)}`,
    `A ${outer} ${outer} 0 ${large} 1 ${point(a1, outer)}`,
    `L ${point(a1, inner)}`,
    `A ${inner} ${inner} 0 ${large} 0 ${point(a0, inner)}`,
    'Z',
  ].join(' ');
}

function formatShare(share: number): string {
  return `${NUMBER_FORMAT.format(Math.round(share * 100))}%`;
}

/**
 * Part-to-whole of the period's reports as a donut, one breakdown at a
 * time. Colors follow the entity (its place in the backend's fixed enum
 * order), not its rank. Hovering a slice or a legend row brings it forward
 * and shows its numbers in the center; both lead to the matching reports.
 * The legend lists every row with its count and share, so nothing depends
 * on color alone.
 */
export function ReportsDistributionChart({ breakdowns, total }: ReportsDistributionChartProps) {
  const navigate = useNavigate();
  const [selected, setSelected] = useState(breakdowns[0]?.value ?? '');
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const breakdown = breakdowns.find((b) => b.value === selected) ?? breakdowns[0];
  // The ring sweeps in on mount, on a tab change and when the period's numbers change.
  const progress = useDrawProgress(`${breakdown?.value}:${total}`);
  if (!breakdown) return null;

  let colorSlot = 0;
  let cursor = 0;
  const slices: Slice[] = breakdown.items.map((item) => {
    const color =
      item.key === null ? UNSPECIFIED_COLOR : SERIES_COLORS[colorSlot++ % SERIES_COLORS.length]!;
    const share = total > 0 ? item.count / total : 0;
    const start = cursor;
    cursor += share * Math.PI * 2;
    return { item, color, share, href: breakdown.hrefFor?.(item), start, end: cursor };
  });
  const drawn = slices.filter((slice) => slice.item.count > 0);
  // Every report of the period predates this field: the ring is one grey «غير محدد»
  // slice, which reads as empty — say why instead of leaving it unexplained.
  const allUnspecified = total > 0 && drawn.length === 1 && drawn[0]!.item.key === null;
  const fieldName = breakdown.label.replace(/^حسب\s+/, '');
  const active = activeIndex === null ? null : (slices[activeIndex] ?? null);

  function changeBreakdown(value: string) {
    setSelected(value);
    setActiveIndex(null);
  }

  return (
    <Card className="h-full">
      <CardHeader className="flex-row flex-wrap items-center justify-between gap-3 space-y-0">
        <CardTitle>توزيع الضبوط</CardTitle>
        <SegmentedTabs
          idPrefix={ID_PREFIX}
          label="توزيع الضبوط حسب"
          tabs={breakdowns.map(({ value, label }) => ({ value, label }))}
          value={breakdown.value}
          onChange={changeBreakdown}
        />
      </CardHeader>
      <CardContent
        role="tabpanel"
        id={`${ID_PREFIX}-panel-${breakdown.value}`}
        aria-labelledby={`${ID_PREFIX}-tab-${breakdown.value}`}
        className="flex flex-col items-center gap-6 sm:flex-row sm:items-center"
      >
        <div className="relative w-52 shrink-0 sm:w-56">
          <svg
            viewBox={`0 0 ${SIZE} ${SIZE}`}
            className="block h-auto w-full"
            role="img"
            aria-label={`توزيع ${NUMBER_FORMAT.format(total)} ضبط ${breakdown.label}`}
          >
            {drawn.length === 0 && (
              <circle
                cx={CENTER}
                cy={CENTER}
                r={(OUTER_RADIUS + INNER_RADIUS) / 2}
                fill="none"
                stroke="hsl(var(--muted))"
                strokeWidth={OUTER_RADIUS - INNER_RADIUS}
              />
            )}
            {drawn.map((slice) => {
              const index = slices.indexOf(slice);
              const isActive = activeIndex === index;
              const outer = OUTER_RADIUS;
              const faded = activeIndex !== null && !isActive;
              const shared = {
                fill: slice.color,
                stroke: 'hsl(var(--card))',
                strokeWidth: 2,
                style: {
                  transformOrigin: `${CENTER}px ${CENTER}px`,
                  transform: `scale(${isActive ? ACTIVE_SCALE : 1})`,
                  transition: 'transform 250ms cubic-bezier(0.22, 1, 0.36, 1), opacity 200ms',
                },
                className: cn(faded && 'opacity-30', slice.href && 'cursor-pointer'),
                onMouseEnter: () => setActiveIndex(index),
                onMouseLeave: () => setActiveIndex(null),
                onClick: slice.href ? () => navigate(slice.href!) : undefined,
              };
              // A lone, fully drawn slice is a whole ring; an arc from 0 to 2π would collapse.
              return drawn.length === 1 && progress > 0.999 ? (
                <path
                  key={String(slice.item.key)}
                  {...shared}
                  fillRule="evenodd"
                  d={`M ${CENTER - outer} ${CENTER} a ${outer} ${outer} 0 1 0 ${outer * 2} 0 a ${outer} ${outer} 0 1 0 ${-outer * 2} 0 M ${CENTER - INNER_RADIUS} ${CENTER} a ${INNER_RADIUS} ${INNER_RADIUS} 0 1 0 ${INNER_RADIUS * 2} 0 a ${INNER_RADIUS} ${INNER_RADIUS} 0 1 0 ${-INNER_RADIUS * 2} 0`}
                />
              ) : (
                <path
                  key={String(slice.item.key)}
                  {...shared}
                  strokeLinejoin="round"
                  d={sectorPath(
                    slice.start * progress,
                    // Never quite 2π while sweeping: a closed arc would vanish.
                    Math.min(slice.end * progress, Math.PI * 2 - 0.0001),
                    outer,
                    INNER_RADIUS,
                  )}
                />
              );
            })}
          </svg>

          <div
            className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-12 text-center"
            aria-live="polite"
          >
            {active ? (
              <>
                <span className="text-2xl font-bold tabular-nums leading-tight">
                  {NUMBER_FORMAT.format(active.item.count)}
                </span>
                <span className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                  {active.item.label}
                </span>
                <span className="mt-0.5 text-xs font-semibold tabular-nums">
                  {formatShare(active.share)}
                </span>
              </>
            ) : (
              <>
                <AnimatedNumber
                  value={total}
                  format={NUMBER_FORMAT}
                  className="text-3xl font-bold leading-tight"
                />
                <span className="mt-0.5 text-xs text-muted-foreground">ضبوط الفترة</span>
              </>
            )}
          </div>
        </div>

        {total === 0 ? (
          <p className="flex-1 py-6 text-center text-sm text-muted-foreground">
            لا توجد ضبوط في هذه الفترة
          </p>
        ) : (
          <div className="w-full min-w-0 flex-1 space-y-3">
            <motion.ul
              key={breakdown.value}
              className="space-y-0.5"
              initial="hidden"
              animate="visible"
              variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.04 } } }}
            >
              {slices.map((slice, index) => {
                const empty = slice.item.count === 0;
                const rowProps = {
                  onMouseEnter: () => !empty && setActiveIndex(index),
                  onMouseLeave: () => setActiveIndex(null),
                  onFocus: () => !empty && setActiveIndex(index),
                  onBlur: () => setActiveIndex(null),
                  className: cn(
                    'flex items-center gap-3 rounded-lg px-2 py-2 text-sm transition-colors',
                    activeIndex === index && 'bg-muted/60',
                    empty && 'text-muted-foreground',
                  ),
                };
                const content = (
                  <>
                    <span
                      className={cn('h-2.5 w-2.5 shrink-0 rounded-full', empty && 'opacity-40')}
                      style={{ backgroundColor: slice.color }}
                      aria-hidden="true"
                    />
                    <span className="min-w-0 flex-1 truncate">{slice.item.label}</span>
                    <span className="shrink-0 tabular-nums">
                      <span className="font-semibold">
                        {NUMBER_FORMAT.format(slice.item.count)}
                      </span>
                      <span className="ms-1.5 inline-block w-10 text-end text-xs text-muted-foreground">
                        {formatShare(slice.share)}
                      </span>
                    </span>
                  </>
                );
                return (
                  <motion.li
                    key={String(slice.item.key)}
                    variants={{
                      hidden: { opacity: 0, x: 8 },
                      visible: { opacity: 1, x: 0, transition: { duration: 0.3, ease: EASE_OUT } },
                    }}
                  >
                    {slice.href && !empty ? (
                      <Link
                        to={slice.href}
                        title={`عرض ضبوط «${slice.item.label}»`}
                        {...rowProps}
                        className={cn(
                          rowProps.className,
                          'hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
                        )}
                      >
                        {content}
                      </Link>
                    ) : (
                      <div {...rowProps}>{content}</div>
                    )}
                  </motion.li>
                );
              })}
            </motion.ul>
            {allUnspecified && (
              <p className="flex items-start gap-2 rounded-lg bg-muted/60 px-3 py-2 text-xs leading-5 text-muted-foreground">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span>
                  كل ضبوط الفترة أُنشئت قبل إضافة حقل «{fieldName}»، فهي «غير محدد». عدّل أي ضبط
                  وحدّد {fieldName} ليظهر في هذا التوزيع.
                </span>
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
