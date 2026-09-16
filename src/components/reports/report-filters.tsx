import { Search } from 'lucide-react';
import { useReportTypes } from '@/hooks/report-types/use-report-types';
import { useUsers } from '@/hooks/users/use-users';
import {
  DropdownSelect,
  DropdownSelectContent,
  DropdownSelectItem,
  DropdownSelectTrigger,
  DropdownSelectValue,
} from '@/components/ui/dropdown-select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import type { ReportListParams } from '@/types/report';

interface ReportFiltersProps {
  value: ReportListParams;
  onChange: (value: ReportListParams) => void;
  search: string;
  onSearchChange: (value: string) => void;
}

const ALL_TYPES = 'all';
const ALL_CREATORS = 'all';
const DEFAULT_SORT = 'reportDate,desc';

export function ReportFilters({ value, onChange, search, onSearchChange }: ReportFiltersProps) {
  const { data: types = [] } = useReportTypes();
  const { data: users = [] } = useUsers();

  const hasActiveFilters = Boolean(
    search ||
      value.typeId ||
      value.creatorId ||
      value.from ||
      value.to ||
      (value.sort && value.sort !== DEFAULT_SORT),
  );

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-7">
      <FormField label="بحث برقم الضبط" htmlFor="filter-search">
        <div className="relative">
          <Search className="pointer-events-none absolute inset-y-0 end-3 my-auto h-4 w-4 text-muted-foreground" />
          <Input
            id="filter-search"
            type="search"
            placeholder="مثال: 2024-015"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pe-9"
          />
        </div>
      </FormField>
      <FormField label="النوع" htmlFor="filter-type">
        <DropdownSelect
          value={value.typeId !== undefined ? String(value.typeId) : ALL_TYPES}
          onValueChange={(next) =>
            onChange({
              ...value,
              typeId: next === ALL_TYPES ? undefined : Number(next),
              page: 0,
            })
          }
        >
          <DropdownSelectTrigger id="filter-type">
            <DropdownSelectValue />
          </DropdownSelectTrigger>
          <DropdownSelectContent>
            <DropdownSelectItem value={ALL_TYPES}>جميع الأنواع</DropdownSelectItem>
            {types.map((t) => (
              <DropdownSelectItem key={t.id} value={String(t.id)}>
                {t.name}
              </DropdownSelectItem>
            ))}
          </DropdownSelectContent>
        </DropdownSelect>
      </FormField>
      <FormField label="المُنشئ" htmlFor="filter-creator">
        <DropdownSelect
          value={value.creatorId ?? ALL_CREATORS}
          onValueChange={(next) =>
            onChange({ ...value, creatorId: next === ALL_CREATORS ? undefined : next, page: 0 })
          }
        >
          <DropdownSelectTrigger id="filter-creator">
            <DropdownSelectValue />
          </DropdownSelectTrigger>
          <DropdownSelectContent>
            <DropdownSelectItem value={ALL_CREATORS}>جميع المستخدمين</DropdownSelectItem>
            {users.map((u) => (
              <DropdownSelectItem key={u.id} value={u.id}>
                {u.fullName}
              </DropdownSelectItem>
            ))}
          </DropdownSelectContent>
        </DropdownSelect>
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
        <DropdownSelect
          value={value.sort ?? DEFAULT_SORT}
          onValueChange={(next) => onChange({ ...value, sort: next, page: 0 })}
        >
          <DropdownSelectTrigger id="filter-sort">
            <DropdownSelectValue />
          </DropdownSelectTrigger>
          <DropdownSelectContent>
            <DropdownSelectItem value="reportDate,desc">التاريخ (الأحدث أولاً)</DropdownSelectItem>
            <DropdownSelectItem value="reportDate,asc">التاريخ (الأقدم أولاً)</DropdownSelectItem>
            <DropdownSelectItem value="reportNumber,asc">
              رقم الضبط (تصاعدي)
            </DropdownSelectItem>
            <DropdownSelectItem value="reportNumber,desc">
              رقم الضبط (تنازلي)
            </DropdownSelectItem>
          </DropdownSelectContent>
        </DropdownSelect>
      </FormField>
      <div className="flex items-end">
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => {
            onSearchChange('');
            onChange({ page: 0 });
          }}
          disabled={!hasActiveFilters}
        >
          مسح الفلاتر
        </Button>
      </div>
    </div>
  );
}
