import { useReportTypes } from '@/hooks/report-types/use-report-types';
import { Select } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import type { ReportListParams } from '@/types/report';

interface ReportFiltersProps {
  value: ReportListParams;
  onChange: (value: ReportListParams) => void;
}

export function ReportFilters({ value, onChange }: ReportFiltersProps) {
  const { data: types = [] } = useReportTypes();

  const hasActiveFilters = Boolean(
    value.typeId || value.from || value.to || (value.sort && value.sort !== 'reportDate,desc'),
  );

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <FormField label="النوع" htmlFor="filter-type">
        <Select
          id="filter-type"
          value={value.typeId ?? ''}
          onChange={(e) =>
            onChange({
              ...value,
              typeId: e.target.value ? Number(e.target.value) : undefined,
              page: 0,
            })
          }
        >
          <option value="">جميع الأنواع</option>
          {types.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </Select>
      </FormField>
      <FormField label="من" htmlFor="filter-from">
        <Input
          id="filter-from"
          type="date"
          value={value.from ?? ''}
          onChange={(e) => onChange({ ...value, from: e.target.value || undefined, page: 0 })}
        />
      </FormField>
      <FormField label="إلى" htmlFor="filter-to">
        <Input
          id="filter-to"
          type="date"
          value={value.to ?? ''}
          onChange={(e) => onChange({ ...value, to: e.target.value || undefined, page: 0 })}
        />
      </FormField>
      <FormField label="الترتيب" htmlFor="filter-sort">
        <Select
          id="filter-sort"
          value={value.sort ?? 'reportDate,desc'}
          onChange={(e) => onChange({ ...value, sort: e.target.value, page: 0 })}
        >
          <option value="reportDate,desc">التاريخ (الأحدث أولاً)</option>
          <option value="reportDate,asc">التاريخ (الأقدم أولاً)</option>
          <option value="reportNumber,asc">رقم التقرير (تصاعدي)</option>
          <option value="reportNumber,desc">رقم التقرير (تنازلي)</option>
        </Select>
      </FormField>
      <div className="flex items-end">
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => onChange({ page: 0 })}
          disabled={!hasActiveFilters}
        >
          مسح الفلاتر
        </Button>
      </div>
    </div>
  );
}
