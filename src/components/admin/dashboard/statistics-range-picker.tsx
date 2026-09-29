import { Button } from '@/components/ui/button';
import { DateInput } from '@/components/ui/date-input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils/cn';
import type { StatisticsRange } from '@/types/report-statistics';

function isoDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

const PRESETS: { label: string; range: () => StatisticsRange }[] = [
  { label: 'الكل', range: () => ({}) },
  {
    label: 'هذا الشهر',
    range: () => {
      const now = new Date();
      return { from: isoDate(new Date(now.getFullYear(), now.getMonth(), 1)), to: isoDate(now) };
    },
  },
  {
    label: 'الشهر الماضي',
    range: () => {
      const now = new Date();
      return {
        from: isoDate(new Date(now.getFullYear(), now.getMonth() - 1, 1)),
        to: isoDate(new Date(now.getFullYear(), now.getMonth(), 0)),
      };
    },
  },
  {
    label: 'هذه السنة',
    range: () => {
      const now = new Date();
      return { from: isoDate(new Date(now.getFullYear(), 0, 1)), to: isoDate(now) };
    },
  },
];

interface StatisticsRangePickerProps {
  value: StatisticsRange;
  onChange: (value: StatisticsRange) => void;
}

/** Quick periods plus explicit from/to dates (by report date, inclusive). */
export function StatisticsRangePicker({ value, onChange }: StatisticsRangePickerProps) {
  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="flex flex-wrap items-center gap-1 rounded-md border border-border-subtle p-0.5">
        {PRESETS.map((preset) => {
          const range = preset.range();
          const active = range.from === value.from && range.to === value.to;
          return (
            <Button
              key={preset.label}
              type="button"
              size="sm"
              variant={active ? 'secondary' : 'ghost'}
              className={cn(active && 'shadow-sm')}
              aria-pressed={active}
              onClick={() => onChange(range)}
            >
              {preset.label}
            </Button>
          );
        })}
      </div>
      <div className="flex items-end gap-2">
        <div className="space-y-1">
          <Label htmlFor="stats-from" className="text-xs">
            من
          </Label>
          <DateInput
            id="stats-from"
            className="h-9"
            value={value.from ?? ''}
            max={value.to}
            onChange={(next) => onChange({ ...value, from: next || undefined })}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="stats-to" className="text-xs">
            إلى
          </Label>
          <DateInput
            id="stats-to"
            className="h-9"
            value={value.to ?? ''}
            min={value.from}
            onChange={(next) => onChange({ ...value, to: next || undefined })}
          />
        </div>
      </div>
    </div>
  );
}
