import { useState } from 'react';
import type { ReactNode } from 'react';
import { ChevronDown, FilterX, Search, SlidersHorizontal } from 'lucide-react';
import { useFormTypes } from '@/hooks/form-types/use-form-types';
import { useCrimeTypes } from '@/hooks/crime-types/use-crime-types';
import { useReportOptions } from '@/hooks/reports/use-report-options';
import { useUsers } from '@/hooks/users/use-users';
import { useCan } from '@/hooks/auth/use-can';
import {
  DropdownSelect,
  DropdownSelectContent,
  DropdownSelectGroup,
  DropdownSelectItem,
  DropdownSelectLabel,
  DropdownSelectTrigger,
  DropdownSelectValue,
} from '@/components/ui/dropdown-select';
import { Input } from '@/components/ui/input';
import { DateInput } from '@/components/ui/date-input';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { cn } from '@/lib/utils/cn';
import { isSelectableFormType } from '@/types/form-type';
import type { ReportListParams } from '@/types/report';

interface ReportFiltersProps {
  value: ReportListParams;
  onChange: (value: ReportListParams) => void;
  search: string;
  onSearchChange: (value: string) => void;
}

/** Radix Select reserves '' — this stands for "no filter". */
const ALL = 'all';
const DEFAULT_SORT = 'reportDate,desc';
const ADVANCED_PANEL_ID = 'report-filters-advanced';
const NUMBER_FORMAT = new Intl.NumberFormat('ar-SY-u-nu-latn');

/** How many of the filters hidden behind "advanced" are currently applied. */
function countAdvanced(value: ReportListParams): number {
  return [
    value.crimeTypeId !== undefined,
    value.creatorId !== undefined,
    Boolean(value.from),
    Boolean(value.to),
    Boolean(value.sort && value.sort !== DEFAULT_SORT),
  ].filter(Boolean).length;
}

interface FilterSelectProps {
  id: string;
  label: string;
  value: string | undefined;
  allLabel: string;
  onChange: (value: string | undefined) => void;
  children: ReactNode;
}

function FilterSelect({ id, label, value, allLabel, onChange, children }: FilterSelectProps) {
  return (
    <FormField label={label} htmlFor={id}>
      <DropdownSelect
        value={value ?? ALL}
        onValueChange={(next) => onChange(next === ALL ? undefined : next)}
      >
        <DropdownSelectTrigger id={id}>
          <DropdownSelectValue />
        </DropdownSelectTrigger>
        <DropdownSelectContent>
          <DropdownSelectItem value={ALL}>{allLabel}</DropdownSelectItem>
          {children}
        </DropdownSelectContent>
      </DropdownSelect>
    </FormField>
  );
}

/**
 * The reports list filters: one row of the everyday filters followed by
 * "clear" and an "advanced" toggle that reveals the rest underneath. The
 * two buttons stay put at the end of the first row either way, and the
 * toggle counts any advanced filters in force while they're hidden.
 */
export function ReportFilters({ value, onChange, search, onSearchChange }: ReportFiltersProps) {
  const can = useCan();
  const canViewFormTypes = can('FORM_TYPES', 'VIEW');
  const canViewCrimeTypes = can('CRIME_TYPES', 'VIEW');
  const canViewUsers = can('USERS', 'VIEW');
  const { data: formTypes = [] } = useFormTypes({ enabled: canViewFormTypes });
  const { data: crimeTypes = [] } = useCrimeTypes({ enabled: canViewCrimeTypes });
  const { data: options } = useReportOptions();
  const { data: users = [] } = useUsers({ enabled: canViewUsers });

  const advancedCount = countAdvanced(value);
  // Arriving with an advanced filter set (e.g. a link from the dashboard) shows it.
  const [showAdvanced, setShowAdvanced] = useState(advancedCount > 0);

  // The formTypeId filter matches that exact type only, so only leaf types
  // (the ones reports are created on) are offered, grouped by their category.
  const categories = formTypes.filter((t) => !isSelectableFormType(t));
  const leavesByParent = (parentId: number) =>
    formTypes.filter((t) => t.parentId === parentId && isSelectableFormType(t));
  const rootLeaves = formTypes.filter((t) => t.parentId === undefined && isSelectableFormType(t));

  const update = (patch: Partial<ReportListParams>) => onChange({ ...value, ...patch, page: 0 });
  const toNumber = (next: string | undefined) => (next === undefined ? undefined : Number(next));

  const hasActiveFilters = Boolean(
    search || value.formTypeId !== undefined || value.type || value.result || advancedCount > 0,
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[repeat(4,minmax(0,1fr))_auto_auto] lg:items-end">
        <FormField label="بحث برقم الضبط" htmlFor="filter-search">
          <div className="relative">
            <Search className="pointer-events-none absolute inset-y-0 end-3 my-auto h-4 w-4 text-muted-foreground" />
            <Input
              id="filter-search"
              type="search"
              placeholder="مثال: 2026/114"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pe-9"
            />
          </div>
        </FormField>
        <FilterSelect
          id="filter-type"
          label="نوع الضبط"
          allLabel="جميع الأنواع"
          value={value.type}
          onChange={(next) => update({ type: next as ReportListParams['type'] })}
        >
          {options?.types.map((o) => (
            <DropdownSelectItem key={o.value} value={o.value}>
              {o.label}
            </DropdownSelectItem>
          ))}
        </FilterSelect>
        <FilterSelect
          id="filter-result"
          label="النتيجة"
          allLabel="جميع النتائج"
          value={value.result}
          onChange={(next) => update({ result: next as ReportListParams['result'] })}
        >
          {options?.results.map((o) => (
            <DropdownSelectItem key={o.value} value={o.value}>
              {o.label}
            </DropdownSelectItem>
          ))}
        </FilterSelect>
        {canViewFormTypes && (
          <FilterSelect
            id="filter-form-type"
            label="نموذج الضبط"
            allLabel="جميع النماذج"
            value={value.formTypeId !== undefined ? String(value.formTypeId) : undefined}
            onChange={(next) => update({ formTypeId: toNumber(next) })}
          >
            {rootLeaves.map((t) => (
              <DropdownSelectItem key={t.id} value={String(t.id)}>
                {t.name}
              </DropdownSelectItem>
            ))}
            {categories.map((category) => (
              <DropdownSelectGroup key={category.id}>
                <DropdownSelectLabel>{category.name}</DropdownSelectLabel>
                {leavesByParent(category.id).map((t) => (
                  <DropdownSelectItem key={t.id} value={String(t.id)}>
                    {t.name}
                  </DropdownSelectItem>
                ))}
              </DropdownSelectGroup>
            ))}
          </FilterSelect>
        )}

        {/* Side by side under the fields on small screens; the last two cells of the row on large ones. */}
        <div className="flex gap-2 sm:col-span-2 lg:contents">
          <Button
            type="button"
            variant="ghost"
            className="h-[42px] flex-1 lg:flex-none"
            onClick={() => {
              onSearchChange('');
              onChange({ page: 0 });
            }}
            disabled={!hasActiveFilters}
          >
            <FilterX />
            <span>مسح الفلاتر</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            className={cn(
              'h-[42px] flex-1 lg:flex-none',
              showAdvanced && 'border-primary/40 bg-primary/5 text-primary',
            )}
            aria-expanded={showAdvanced}
            aria-controls={ADVANCED_PANEL_ID}
            onClick={() => setShowAdvanced((open) => !open)}
          >
            <SlidersHorizontal />
            <span>فلاتر متقدمة</span>
            {!showAdvanced && advancedCount > 0 && (
              <span
                className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs text-primary-foreground"
                aria-label={`${NUMBER_FORMAT.format(advancedCount)} مفعّلة`}
              >
                {NUMBER_FORMAT.format(advancedCount)}
              </span>
            )}
            <ChevronDown
              className={cn('transition-transform duration-syid', showAdvanced && 'rotate-180')}
              aria-hidden="true"
            />
          </Button>
        </div>
      </div>

      <div
        id={ADVANCED_PANEL_ID}
        hidden={!showAdvanced}
        // The class too: a `grid` utility would otherwise override the hidden attribute.
        className={cn(
          'grid grid-cols-1 gap-3 border-t border-border-subtle pt-4 sm:grid-cols-2 lg:grid-cols-5',
          !showAdvanced && 'hidden',
        )}
      >
        {canViewCrimeTypes && (
          <FilterSelect
            id="filter-crime-type"
            label="نوع الجرم"
            allLabel="جميع الجرائم"
            value={value.crimeTypeId !== undefined ? String(value.crimeTypeId) : undefined}
            onChange={(next) => update({ crimeTypeId: toNumber(next) })}
          >
            {crimeTypes.map((c) => (
              <DropdownSelectItem key={c.id} value={String(c.id)}>
                {c.name}
              </DropdownSelectItem>
            ))}
          </FilterSelect>
        )}
        {canViewUsers && (
          <FilterSelect
            id="filter-creator"
            label="المُنشئ"
            allLabel="جميع المستخدمين"
            value={value.creatorId !== undefined ? String(value.creatorId) : undefined}
            onChange={(next) => update({ creatorId: toNumber(next) })}
          >
            {users.map((u) => (
              <DropdownSelectItem key={u.id} value={String(u.id)}>
                {u.fullName}
              </DropdownSelectItem>
            ))}
          </FilterSelect>
        )}
        <FormField label="من تاريخ" htmlFor="filter-from">
          <DateInput
            id="filter-from"
            value={value.from ?? ''}
            max={value.to}
            onChange={(next) => update({ from: next || undefined })}
          />
        </FormField>
        <FormField label="إلى تاريخ" htmlFor="filter-to">
          <DateInput
            id="filter-to"
            value={value.to ?? ''}
            min={value.from}
            onChange={(next) => update({ to: next || undefined })}
          />
        </FormField>
        <FormField label="الترتيب" htmlFor="filter-sort">
          <DropdownSelect
            value={value.sort ?? DEFAULT_SORT}
            onValueChange={(next) => update({ sort: next })}
          >
            <DropdownSelectTrigger id="filter-sort">
              <DropdownSelectValue />
            </DropdownSelectTrigger>
            <DropdownSelectContent>
              <DropdownSelectItem value="reportDate,desc">
                التاريخ (الأحدث أولاً)
              </DropdownSelectItem>
              <DropdownSelectItem value="reportDate,asc">التاريخ (الأقدم أولاً)</DropdownSelectItem>
              <DropdownSelectItem value="reportNumber,asc">رقم الضبط (تصاعدي)</DropdownSelectItem>
              <DropdownSelectItem value="reportNumber,desc">رقم الضبط (تنازلي)</DropdownSelectItem>
            </DropdownSelectContent>
          </DropdownSelect>
        </FormField>
      </div>
    </div>
  );
}
