import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import type { UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  useReportTypeAncestorChain,
  useReportTypeChildren,
  useReportTypeRoots,
} from '@/hooks/report-types/use-report-types';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import {
  DropdownSelect,
  DropdownSelectContent,
  DropdownSelectItem,
  DropdownSelectTrigger,
  DropdownSelectValue,
} from '@/components/ui/dropdown-select';
import { Button } from '@/components/ui/button';
import { DictationTextarea } from '@/components/shared/dictation-textarea';
import { ApiError } from '@/lib/api/client';
import type { ApiErrorBody } from '@/types/api';
import type { ReportResponse } from '@/types/report';

export const reportSchema = z.object({
  reportNumber: z
    .string()
    .min(1, 'رقم الضبط مطلوب')
    .max(100, 'يجب ألا يتجاوز 100 حرف'),
  reportTypeId: z.string().min(1, 'نوع الضبط مطلوب'),
  reportDate: z.string().optional(),
  introduction: z.string().optional(),
  body: z.string().optional(),
  referral: z.string().optional(),
  conclusion: z.string().optional(),
  summary: z.string().optional(),
});

export type ReportFormValues = z.infer<typeof reportSchema>;

const TEXT_FIELDS: {
  name: 'introduction' | 'body' | 'referral' | 'conclusion' | 'summary';
  label: string;
  placeholder: string;
}[] = [
  {
    name: 'introduction',
    label: 'المقدمة',
    placeholder: 'اكتب مقدمة موجزة توضح موضوع الضبط والغرض منه...',
  },
  {
    name: 'body',
    label: 'المتن',
    placeholder: 'اكتب التفاصيل الكاملة للضبط هنا...',
  },
  {
    name: 'referral',
    label: 'الإحالة',
    placeholder: 'اذكر الجهة أو القسم الذي يُحال إليه الضبط (إن وجد)...',
  },
  {
    name: 'conclusion',
    label: 'الخاتمة',
    placeholder: 'اكتب الاستنتاج أو التوصية الختامية للضبط...',
  },
  {
    name: 'summary',
    label: 'الملخص',
    placeholder: 'اكتب ملخصًا مختصرًا لأهم نقاط الضبط...',
  },
];

export function reportToFormValues(report: ReportResponse): ReportFormValues {
  return {
    reportNumber: report.reportNumber,
    reportTypeId: String(report.reportType.id),
    reportDate: report.reportDate,
    introduction: report.introduction ?? '',
    body: report.body ?? '',
    referral: report.referral ?? '',
    conclusion: report.conclusion ?? '',
    summary: report.summary ?? '',
  };
}

export function useReportForm(values?: ReportFormValues): UseFormReturn<ReportFormValues> {
  return useForm<ReportFormValues>({
    resolver: zodResolver(reportSchema),
    values,
  });
}

/** Maps a submitted form's fields to the API's create/update request body. */
export function reportFormValuesToBody(values: ReportFormValues) {
  return {
    reportNumber: values.reportNumber,
    reportTypeId: Number(values.reportTypeId),
    reportDate: values.reportDate || undefined,
    introduction: values.introduction || undefined,
    body: values.body || undefined,
    referral: values.referral || undefined,
    conclusion: values.conclusion || undefined,
    summary: values.summary || undefined,
  };
}

/** Applies field-level errors from a 400/409 API response to the form. */
export function applyReportFormApiError(
  error: unknown,
  setError: UseFormReturn<ReportFormValues>['setError'],
): void {
  if (error instanceof ApiError && error.status === 400) {
    const errorBody = error.details as ApiErrorBody | undefined;
    Object.entries(errorBody?.fieldErrors ?? {}).forEach(([field, message]) => {
      setError(field as keyof ReportFormValues, { message });
    });
  }
  if (error instanceof ApiError && error.status === 409) {
    setError('reportNumber', { message: 'رقم الضبط موجود مسبقًا.' });
  }
}

interface ReportTypeCascadeSelectProps {
  /** The chosen leaf report type id, as a string (react-hook-form convention), or ''. */
  value: string;
  onChange: (id: string) => void;
  error?: string;
}

/**
 * Parent -> child cascading select for report types, driven by
 * GET /report-types/roots (top-level types + child counts) and
 * GET /report-types/{id}/children — fetched lazily per level instead of
 * loading the whole tree up front. Renders one <Select> per level; picking
 * a type with sub-types reveals another level underneath it, while picking
 * a childless type commits it as the report's reportTypeId.
 */
function ReportTypeCascadeSelect({ value, onChange, error }: ReportTypeCascadeSelectProps) {
  const { data: roots = [] } = useReportTypeRoots();
  // Ids chosen at each level so far (root first).
  const [levels, setLevels] = useState<string[]>(['']);
  // Whether the type chosen at each level (same indices as `levels`) has sub-types of its own.
  const [hasChildrenByLevel, setHasChildrenByLevel] = useState<boolean[]>([]);

  // Resolve the ancestor chain for a pre-existing value (edit mode) so
  // every level shows the right pre-selected option once loaded.
  const leafId = value ? Number(value) : null;
  const { data: ancestorChain } = useReportTypeAncestorChain(leafId);

  useEffect(() => {
    if (!ancestorChain) return;
    const derived = ancestorChain.map((t) => String(t.id));
    setLevels((current) =>
      current.length === derived.length && current.every((v, i) => v === derived[i])
        ? current
        : derived,
    );
    // The leaf (last entry) is the only one we know for certain has no
    // children; levels above it are ancestors and therefore always do.
    setHasChildrenByLevel(derived.map((_, i) => i < derived.length - 1));
  }, [ancestorChain]);

  const rootSelected = levels[0] ?? '';
  const rootNode = roots.find((t) => String(t.id) === rootSelected);
  const rootHasChildren = (rootNode?.childrenCount ?? 0) > 0;

  function selectRoot(id: string) {
    setLevels([id]);
    const node = roots.find((t) => String(t.id) === id);
    const hasChildren = (node?.childrenCount ?? 0) > 0;
    setHasChildrenByLevel([hasChildren]);
    onChange(id && !hasChildren ? id : '');
  }

  /** Called by a child level once it knows whether `id` (its own selection) has further sub-types. */
  function selectAt(levelIndex: number, id: string, hasChildren: boolean) {
    const nextLevels = levels.slice(0, levelIndex + 1);
    nextLevels[levelIndex] = id;
    setLevels(nextLevels);
    setHasChildrenByLevel((current) => {
      const next = current.slice(0, levelIndex + 1);
      next[levelIndex] = hasChildren;
      return next;
    });
    onChange(id && !hasChildren ? id : '');
  }

  return (
    <>
      <FormField label="نوع الضبط الرئيسي" htmlFor="reportTypeLevel-0" error={error} required>
        <DropdownSelect value={rootSelected} onValueChange={selectRoot}>
          <DropdownSelectTrigger id="reportTypeLevel-0" aria-invalid={Boolean(error)}>
            <DropdownSelectValue placeholder="اختر نوعًا" />
          </DropdownSelectTrigger>
          <DropdownSelectContent>
            {roots.map((t) => (
              <DropdownSelectItem key={t.id} value={String(t.id)}>
                {t.name}
              </DropdownSelectItem>
            ))}
          </DropdownSelectContent>
        </DropdownSelect>
      </FormField>
      {rootSelected && rootHasChildren && (
        <ReportTypeCascadeChildLevel
          levelIndex={1}
          parentId={Number(rootSelected)}
          selected={levels[1] ?? ''}
          onSelect={(id, hasChildren) => selectAt(1, id, hasChildren)}
        />
      )}
      {levels.slice(1).map((selected, i) => {
        const levelIndex = i + 2;
        const parentId = levels[levelIndex - 1];
        const parentHasChildren = hasChildrenByLevel[levelIndex - 1];
        if (!selected || !parentId || !parentHasChildren) return null;
        return (
          <ReportTypeCascadeChildLevel
            key={`${parentId}-${levelIndex}`}
            levelIndex={levelIndex}
            parentId={Number(parentId)}
            selected={levels[levelIndex] ?? ''}
            onSelect={(id, hasChildren) => selectAt(levelIndex, id, hasChildren)}
          />
        );
      })}
    </>
  );
}

interface ReportTypeCascadeChildLevelProps {
  levelIndex: number;
  parentId: number;
  selected: string;
  onSelect: (id: string, hasChildren: boolean) => void;
}

/**
 * A non-root cascade level: fetches its own options via
 * GET /report-types/{parentId}/children, and once the user picks one,
 * fetches *that* type's children to decide whether to reveal another
 * level (reported back to the parent via onSelect's hasChildren flag).
 */
function ReportTypeCascadeChildLevel({
  levelIndex,
  parentId,
  selected,
  onSelect,
}: ReportTypeCascadeChildLevelProps) {
  const { data: options = [] } = useReportTypeChildren(parentId);
  const selectedId = selected ? Number(selected) : null;
  const { data: grandchildren, isSuccess } = useReportTypeChildren(selectedId);

  useEffect(() => {
    if (selected && isSuccess) {
      onSelect(selected, (grandchildren?.length ?? 0) > 0);
    }
    // Only re-run when the resolved grandchildren for the *current*
    // selection change — onSelect is intentionally excluded to avoid a
    // loop, since calling it can itself change `selected` via the parent.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, isSuccess, grandchildren]);

  return (
    <FormField
      label={`نوع فرعي ${levelIndex > 1 ? levelIndex : ''}`.trim()}
      htmlFor={`reportTypeLevel-${levelIndex}`}
    >
      <DropdownSelect value={selected} onValueChange={(id) => onSelect(id, false)}>
        <DropdownSelectTrigger id={`reportTypeLevel-${levelIndex}`}>
          <DropdownSelectValue placeholder="اختر نوعًا" />
        </DropdownSelectTrigger>
        <DropdownSelectContent>
          {options.map((t) => (
            <DropdownSelectItem key={t.id} value={String(t.id)}>
              {t.name}
            </DropdownSelectItem>
          ))}
        </DropdownSelectContent>
      </DropdownSelect>
    </FormField>
  );
}

interface ReportFormFieldsProps {
  form: UseFormReturn<ReportFormValues>;
}

/**
 * The report create/edit form fields, shared between the "create" dialog
 * (reports-list-page) and the full edit page (report-form-page). Callers
 * own the <form> element, submit handling, and the submit button so each
 * can render its own layout/actions around these fields.
 */
export function ReportFormFields({ form }: ReportFormFieldsProps) {
  const {
    register,
    setValue,
    getValues,
    watch,
    formState: { errors },
  } = form;
  const reportTypeId = watch('reportTypeId');

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <FormField
          label="رقم الضبط"
          htmlFor="reportNumber"
          error={errors.reportNumber?.message}
          required
        >
          <Input
            id="reportNumber"
            placeholder="مثال: 2024-015"
            aria-invalid={Boolean(errors.reportNumber)}
            {...register('reportNumber')}
          />
        </FormField>
        <ReportTypeCascadeSelect
          value={reportTypeId}
          onChange={(id) => setValue('reportTypeId', id, { shouldValidate: true })}
          error={errors.reportTypeId?.message}
        />
        <FormField label="التاريخ" htmlFor="reportDate" error={errors.reportDate?.message}>
          <Input id="reportDate" type="date" {...register('reportDate')} />
        </FormField>
      </div>

      {TEXT_FIELDS.map(({ name, label, placeholder }) => (
        <FormField key={name} label={label} htmlFor={name} error={errors[name]?.message}>
          <DictationTextarea
            id={name}
            placeholder={placeholder}
            onDictatedText={(text) => {
              const current = getValues(name) ?? '';
              setValue(name, current ? `${current} ${text}` : text, { shouldDirty: true });
            }}
            {...register(name)}
          />
        </FormField>
      ))}
    </>
  );
}

interface ReportFormSubmitButtonProps {
  isPending: boolean;
  isEdit: boolean;
}

export function ReportFormSubmitButton({ isPending, isEdit }: ReportFormSubmitButtonProps) {
  return (
    <Button type="submit" disabled={isPending}>
      {isPending ? 'جاري الحفظ…' : isEdit ? 'حفظ التغييرات' : 'إنشاء ضبط'}
    </Button>
  );
}
