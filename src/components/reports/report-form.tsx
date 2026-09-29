import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Controller, useWatch } from 'react-hook-form';
import type { Control, UseFormReturn } from 'react-hook-form';
import { Archive, FileText, Gavel, Info, ScrollText, Users } from 'lucide-react';
import { useReportOptions } from '@/hooks/reports/use-report-options';
import { useCrimeTypes } from '@/hooks/crime-types/use-crime-types';
import { useCan } from '@/hooks/auth/use-can';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { DateInput } from '@/components/ui/date-input';
import {
  DropdownSelect,
  DropdownSelectContent,
  DropdownSelectItem,
  DropdownSelectTrigger,
  DropdownSelectValue,
} from '@/components/ui/dropdown-select';
import { Button } from '@/components/ui/button';
import { ChoiceChips } from '@/components/ui/choice-chips';
import type { ChoiceChipOption } from '@/components/ui/choice-chips';
import { SegmentedTabs } from '@/components/ui/segmented-tabs';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils/cn';
import { DictationRichText } from '@/components/shared/dictation-rich-text';
import { FormTypeCascadeSelect } from '@/components/reports/form-type-cascade-select';
import { ReportFormNav, ReportFormSection } from '@/components/reports/report-form-sections';
import type { ReportSectionMeta } from '@/components/reports/report-form-sections';
import { REPORT_SECTION_FIELDS, countFilled } from '@/components/reports/report-form-schema';
import type { ReportFormValues, ReportSectionKey } from '@/components/reports/report-form-schema';

/** Stand-in for "no value" in a DropdownSelect, since Radix reserves ''. */
const NONE = 'none';

const SECTIONS: ReportSectionMeta[] = [
  {
    key: 'basics',
    title: 'بيانات الضبط',
    hint: 'الرقم والتاريخ والتصنيف والنتيجة',
    icon: FileText,
    required: true,
  },
  { key: 'crime', title: 'الجرم', hint: 'نوعه ومكانه وتاريخه وحالته', icon: Gavel },
  { key: 'parties', title: 'الأطراف', hint: 'المدعي والمدعى عليه', icon: Users },
  { key: 'action', title: 'الإجراء والمصادرات', hint: 'ما اتُّخذ وما صودر أو حُجز', icon: Archive },
  {
    key: 'text',
    title: 'نص ورقة الضبط',
    hint: 'الخلاصة والمقدمة والمتن والخاتمة والإحالة',
    icon: ScrollText,
  },
];

/** Open at first: the required basics and the commonly filled crime details. */
const INITIALLY_OPEN: Record<ReportSectionKey, boolean> = {
  basics: true,
  crime: true,
  parties: false,
  action: false,
  text: false,
};

const TEXT_FIELDS: {
  name: 'introduction' | 'body' | 'referral' | 'conclusion' | 'summary';
  label: string;
  /** Where the text lands on the printed ورقة ضبط. */
  hint: string;
  placeholder: string;
}[] = [
  {
    name: 'summary',
    label: 'الخلاصة',
    hint: 'العمود الأيمن من الورقة، وعمود «الموضوع» في سجل الضبوط',
    placeholder: 'خلاصة موجزة لموضوع الضبط...',
  },
  {
    name: 'introduction',
    label: 'المقدمة',
    hint: 'بداية نص الورقة: اليوم والتاريخ والموقّعون',
    placeholder: 'في هذا اليوم...',
  },
  {
    name: 'body',
    label: 'المتن',
    hint: 'الإفادات والتفاصيل، مع العناوين الفرعية وأسطر التواقيع',
    placeholder: 'اكتب التفاصيل الكاملة للضبط هنا...',
  },
  {
    name: 'conclusion',
    label: 'الخاتمة',
    hint: 'عدد النسخ وجهاتها ووقت التحرير والختم',
    placeholder: 'الضبط على نسختين...',
  },
  {
    name: 'referral',
    label: 'الإحالة',
    hint: 'العمود الأيمن، وكل سطر يُطبع سطرًا مستقلًا',
    placeholder: 'تحال من ... إلى ... في ...',
  },
];

const PARTIES = [
  { name: 'plaintiff', label: 'المدعي' },
  { name: 'defendant', label: 'المدعى عليه' },
] as const;

const PARTY_FIELDS: { name: keyof ReportFormValues['plaintiff']; label: string }[] = [
  { name: 'name', label: 'الاسم' },
  { name: 'motherName', label: 'اسم الأم' },
  { name: 'nationalId', label: 'الرقم الوطني' },
  { name: 'origin', label: 'البلد الأصلي' },
  { name: 'residence', label: 'مكان الإقامة' },
];

const CONFISCATION_FIELDS: { name: keyof ReportFormValues['confiscation']; label: string }[] = [
  { name: 'weapons', label: 'السلاح' },
  { name: 'vehicles', label: 'الآليات' },
  { name: 'drugs', label: 'المخدرات' },
  { name: 'money', label: 'المال' },
  { name: 'seizedItems', label: 'المحجوزات' },
];

/** A markup example in the formatting hint; <bdi> keeps its symbols in place inside Arabic text. */
function Token({ children }: { children: ReactNode }) {
  return (
    <bdi className="rounded bg-muted px-1 py-0.5 font-semibold text-foreground">{children}</bdi>
  );
}

/** Marks a tab whose panel has content. */
function FilledDot() {
  return <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-label="مُعبّأ" />;
}

interface ChipsFieldProps {
  control: Control<ReportFormValues>;
  name: 'type' | 'result' | 'searchBroadcast';
  label: string;
  options: ChoiceChipOption[];
  error?: string;
  required?: boolean;
}

/** A labelled single choice shown as pills, bound to a string form field. */
function ChipsField({ control, name, label, options, error, required }: ChipsFieldProps) {
  const labelId = `${name}-label`;
  return (
    <div className="space-y-1.5">
      <span id={labelId} className="block text-sm font-medium leading-none">
        {label}
        {required && (
          <span className="text-destructive" aria-hidden="true">
            {' '}
            *
          </span>
        )}
      </span>
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <ChoiceChips
            id={name}
            aria-labelledby={labelId}
            aria-invalid={Boolean(error)}
            options={options}
            value={field.value}
            onChange={field.onChange}
          />
        )}
      />
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

interface SwitchFieldProps {
  control: Control<ReportFormValues>;
  name: 'prosecutionPermission' | 'discovered';
  label: string;
  onText: string;
  offText: string;
}

/** A yes/no field as a switch row that states its current meaning. */
function SwitchField({ control, name, label, onText, offText }: SwitchFieldProps) {
  const labelId = `${name}-label`;
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <div className="flex h-[42px] items-center justify-between gap-3 rounded-xl border border-input bg-card px-3.5">
          <span id={labelId} className="text-sm font-medium">
            {label}
            <span className="ms-2 text-xs font-normal text-muted-foreground">
              {field.value ? onText : offText}
            </span>
          </span>
          <Switch
            id={name}
            aria-labelledby={labelId}
            checked={field.value}
            onCheckedChange={field.onChange}
          />
        </div>
      )}
    />
  );
}

interface CrimeTypeSelectProps {
  control: Control<ReportFormValues>;
  options: { value: string; label: string }[];
  error?: string;
  /** Without CRIME_TYPES:VIEW the list can't be loaded, so the field is left as it is. */
  disabled?: boolean;
}

function CrimeTypeSelect({ control, options, error, disabled }: CrimeTypeSelectProps) {
  return (
    <FormField
      label="نوع الجرم"
      htmlFor="crimeTypeId"
      error={error}
      hint={disabled ? 'لا تملك صلاحية استعراض أنواع الجرم.' : undefined}
    >
      <Controller
        control={control}
        name="crimeTypeId"
        render={({ field }) => (
          <DropdownSelect
            value={field.value === '' ? NONE : field.value}
            onValueChange={(next) => {
              // Inside a <form>, Radix's hidden native <select> reports '' while the saved
              // crime type's option hasn't loaded yet — that would silently clear it on edit.
              // A real choice is never '' ("بدون جرم" is NONE), so ignore it.
              if (next === '') return;
              field.onChange(next === NONE ? '' : next);
            }}
          >
            <DropdownSelectTrigger
              id="crimeTypeId"
              aria-invalid={Boolean(error)}
              disabled={disabled}
            >
              <DropdownSelectValue />
            </DropdownSelectTrigger>
            <DropdownSelectContent>
              <DropdownSelectItem value={NONE}>بدون جرم</DropdownSelectItem>
              {options.map((option) => (
                <DropdownSelectItem key={option.value} value={option.value}>
                  {option.label}
                </DropdownSelectItem>
              ))}
            </DropdownSelectContent>
          </DropdownSelect>
        )}
      />
    </FormField>
  );
}

/** The two parties behind one tab strip; both stay mounted so a server error in either can surface. */
function PartyFields({ form }: { form: UseFormReturn<ReportFormValues> }) {
  const {
    register,
    control,
    formState: { errors },
  } = form;
  const [active, setActive] = useState<'plaintiff' | 'defendant'>('plaintiff');
  const [plaintiff, defendant] = useWatch({ control, name: ['plaintiff', 'defendant'] });
  const filled = { plaintiff: countFilled(plaintiff), defendant: countFilled(defendant) };
  const invalid = { plaintiff: Boolean(errors.plaintiff), defendant: Boolean(errors.defendant) };

  // Show the party with a (server) error rather than leave it behind the other tab.
  useEffect(() => {
    if (invalid[active]) return;
    if (invalid.plaintiff) setActive('plaintiff');
    else if (invalid.defendant) setActive('defendant');
  }, [invalid.plaintiff, invalid.defendant, active]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-4">
      <SegmentedTabs
        idPrefix="party"
        label="الطرف"
        value={active}
        onChange={(v) => setActive(v as 'plaintiff' | 'defendant')}
        tabs={PARTIES.map((p) => ({
          value: p.name,
          label: p.label,
          invalid: invalid[p.name],
          adornment: filled[p.name] > 0 ? <FilledDot /> : undefined,
        }))}
      />
      {PARTIES.map((party) => (
        <div
          key={party.name}
          id={`party-panel-${party.name}`}
          role="tabpanel"
          aria-labelledby={`party-tab-${party.name}`}
          hidden={active !== party.name}
          // The class too: a `grid` utility would otherwise override the hidden attribute.
          className={cn(
            'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3',
            active !== party.name && 'hidden',
          )}
        >
          {PARTY_FIELDS.map(({ name, label }) => {
            const id = `${party.name}-${name}`;
            const error = errors[party.name]?.[name]?.message;
            return (
              <FormField key={name} label={label} htmlFor={id} error={error}>
                <Input
                  id={id}
                  aria-invalid={Boolean(error)}
                  {...register(`${party.name}.${name}`)}
                />
              </FormField>
            );
          })}
        </div>
      ))}
    </div>
  );
}

/** The five sheet texts, one under another, each with its own label and where it prints. */
function SheetTextFields({
  form,
  isEdit,
}: {
  form: UseFormReturn<ReportFormValues>;
  isEdit: boolean;
}) {
  const {
    control,
    setValue,
    formState: { errors },
  } = form;
  const values = useWatch({ control, name: TEXT_FIELDS.map((f) => f.name) });

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        {!isEdit && (
          <p className="flex items-start gap-2 rounded-xl bg-primary/5 px-3.5 py-2.5 text-sm text-foreground/80">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
            <span>
              اترك النصوص كلها فارغة لتُعبّأ تلقائيًا من النص الرسمي لنموذج الضبط المختار.
            </span>
          </p>
        )}
        <p className="text-xs leading-6 text-muted-foreground">
          التنسيق: <Token># عنوان</Token> في بداية السطر لعنوان فرعي، <Token>&gt; نص</Token> لسطر في
          المنتصف، <Token>**نص**</Token> للغامق، و<Token>@دور⇥دور</Token> لسطر التواقيع.
        </p>
      </div>

      <div className="divide-y divide-border-subtle">
        {TEXT_FIELDS.map(({ name, label, hint, placeholder }, i) => (
          <FormField
            key={name}
            label={label}
            htmlFor={name}
            error={errors[name]?.message}
            className="py-5 first:pt-0 last:pb-0"
            labelExtra={<span className="text-xs text-muted-foreground">{hint}</span>}
          >
            <DictationRichText
              id={name}
              placeholder={placeholder}
              aria-invalid={Boolean(errors[name])}
              value={values[i] ?? ''}
              onChange={(text) => setValue(name, text, { shouldDirty: true })}
            />
          </FormField>
        ))}
      </div>
    </div>
  );
}

interface ReportFormFieldsProps {
  form: UseFormReturn<ReportFormValues>;
  /** On create, empty text fields are filled from the form type's official template. */
  isEdit: boolean;
}

/**
 * The report create/edit form, shared between the "create" dialog
 * (reports-list-page) and the full edit page (report-form-page): a
 * section index on the side, and the fields in five cards — the required
 * basics first, the optional ones collapsible with a progress line.
 * Callers own the <form> element and render ReportFormActions.
 */
export function ReportFormFields({ form, isEdit }: ReportFormFieldsProps) {
  const {
    register,
    control,
    setValue,
    watch,
    formState: { errors },
  } = form;
  const { data: options } = useReportOptions();
  const canViewCrimeTypes = useCan()('CRIME_TYPES', 'VIEW');
  const { data: crimeTypes = [] } = useCrimeTypes({ enabled: canViewCrimeTypes });
  const hasCrimeType = useWatch({ control, name: 'crimeTypeId' }) !== '';
  const [open, setOpen] = useState(INITIALLY_OPEN);

  const crimeTypeOptions = crimeTypes.map((c) => ({ value: String(c.id), label: c.name }));
  const searchBroadcastOptions = [
    { value: '', label: 'غير محدد' },
    ...(options?.searchBroadcasts ?? []),
  ];

  const errorSections = useMemo(
    () =>
      new Set(
        SECTIONS.filter((s) => REPORT_SECTION_FIELDS[s.key].some((f) => errors[f])).map(
          (s) => s.key,
        ),
      ),
    // `errors` is mutated in place by react-hook-form; its key list is what changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(Object.keys(errors))],
  );
  const errorKey = [...errorSections].join(',');

  // Open every section holding an error, then bring the first invalid field into view.
  useEffect(() => {
    if (!errorKey) return;
    setOpen((current) => {
      const next = { ...current };
      errorSections.forEach((key) => (next[key] = true));
      return next;
    });
    // After the sections above have re-rendered open.
    const timer = window.setTimeout(() => {
      const first = document.querySelector<HTMLElement>(
        '[data-report-form] [aria-invalid="true"]:not([hidden] *)',
      );
      first?.focus({ preventScroll: true });
      first?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }, 50);
    return () => window.clearTimeout(timer);
  }, [errorKey]); // eslint-disable-line react-hooks/exhaustive-deps

  function jumpTo(key: ReportSectionKey) {
    setOpen((current) => ({ ...current, [key]: true }));
    requestAnimationFrame(() =>
      document
        .getElementById(`report-section-${key}`)
        ?.scrollIntoView({ block: 'start', behavior: 'smooth' }),
    );
  }

  const sectionProps = (key: ReportSectionKey) => ({
    control,
    section: SECTIONS.find((s) => s.key === key)!,
    open: open[key],
    onOpenChange: (next: boolean) => setOpen((current) => ({ ...current, [key]: next })),
    hasError: errorSections.has(key),
  });

  return (
    <div data-report-form className="lg:grid lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-8">
      <aside className="hidden lg:block">
        <div className="sticky top-0">
          <ReportFormNav
            control={control}
            sections={SECTIONS}
            errorSections={errorSections}
            onJump={jumpTo}
          />
        </div>
      </aside>

      <div className="space-y-4">
        <ReportFormSection {...sectionProps('basics')}>
          <div className="space-y-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                label="رقم الضبط"
                htmlFor="reportNumber"
                error={errors.reportNumber?.message}
                required
              >
                <Input
                  id="reportNumber"
                  placeholder="مثال: 2026/114"
                  aria-invalid={Boolean(errors.reportNumber)}
                  {...register('reportNumber')}
                />
              </FormField>
              <FormField
                label="تاريخ الضبط"
                htmlFor="reportDate"
                error={errors.reportDate?.message}
                required
              >
                <Controller
                  control={control}
                  name="reportDate"
                  render={({ field }) => (
                    <DateInput
                      id="reportDate"
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      aria-invalid={Boolean(errors.reportDate)}
                    />
                  )}
                />
              </FormField>
            </div>
            <ChipsField
              control={control}
              name="type"
              label="نوع الضبط"
              options={options?.types ?? []}
              error={errors.type?.message}
              required
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormTypeCascadeSelect
                value={watch('formTypeId')}
                onChange={(id) =>
                  // Validate live only after a submit attempt, not while a category's sub-type is still being picked.
                  setValue('formTypeId', id, {
                    shouldValidate: form.formState.isSubmitted,
                    shouldDirty: true,
                  })
                }
                error={errors.formTypeId?.message}
              />
            </div>
            <ChipsField
              control={control}
              name="result"
              label="النتيجة"
              options={options?.results ?? []}
              error={errors.result?.message}
              required
            />
          </div>
        </ReportFormSection>

        <ReportFormSection {...sectionProps('crime')}>
          <div className="space-y-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <CrimeTypeSelect
                control={control}
                options={crimeTypeOptions}
                error={errors.crimeTypeId?.message}
                disabled={!canViewCrimeTypes}
              />
              <FormField
                label="مكان الجرم"
                htmlFor="crimePlace"
                error={errors.crimePlace?.message}
                required={hasCrimeType}
              >
                <Input
                  id="crimePlace"
                  aria-invalid={Boolean(errors.crimePlace)}
                  {...register('crimePlace')}
                />
              </FormField>
              <FormField
                label="تاريخ الجرم"
                htmlFor="crimeDate"
                error={errors.crimeDate?.message}
                required={hasCrimeType}
              >
                <Controller
                  control={control}
                  name="crimeDate"
                  render={({ field }) => (
                    <DateInput
                      id="crimeDate"
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      aria-invalid={Boolean(errors.crimeDate)}
                    />
                  )}
                />
              </FormField>
            </div>
            <div className="flex flex-wrap items-end gap-4">
              <ChipsField
                control={control}
                name="searchBroadcast"
                label="إذاعة البحث"
                options={searchBroadcastOptions}
              />
              <div className="min-w-[14rem] flex-1">
                <SwitchField
                  control={control}
                  name="prosecutionPermission"
                  label="إذن النيابة"
                  onText="ممنوح"
                  offText="غير ممنوح"
                />
              </div>
              <div className="min-w-[14rem] flex-1">
                <SwitchField
                  control={control}
                  name="discovered"
                  label="الاكتشاف"
                  onText="مكتشف"
                  offText="غير مكتشف"
                />
              </div>
            </div>
          </div>
        </ReportFormSection>

        <ReportFormSection {...sectionProps('parties')}>
          <PartyFields form={form} />
        </ReportFormSection>

        <ReportFormSection {...sectionProps('action')}>
          <div className="space-y-4">
            <FormField label="الإجراء المتخذ" htmlFor="actionTaken">
              <Textarea id="actionTaken" className="min-h-20" {...register('actionTaken')} />
            </FormField>
            <div className="space-y-2">
              <p className="text-sm font-medium">المصادرات</p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {CONFISCATION_FIELDS.map(({ name, label }) => (
                  <FormField key={name} label={label} htmlFor={`confiscation-${name}`}>
                    <Input id={`confiscation-${name}`} {...register(`confiscation.${name}`)} />
                  </FormField>
                ))}
              </div>
            </div>
            <FormField label="الملاحظات" htmlFor="confiscation-notes">
              <Textarea
                id="confiscation-notes"
                className="min-h-20"
                {...register('confiscation.notes')}
              />
            </FormField>
          </div>
        </ReportFormSection>

        <ReportFormSection {...sectionProps('text')}>
          <SheetTextFields form={form} isEdit={isEdit} />
        </ReportFormSection>
      </div>
    </div>
  );
}

interface ReportFormActionsProps {
  isPending: boolean;
  isEdit: boolean;
  /** A form-level (non-field) error, shown beside the buttons where the user is looking. */
  error?: string;
  onCancel?: () => void;
}

/** The form's action bar: a form-level error on one side, cancel and submit on the other. */
export function ReportFormActions({ isPending, isEdit, error, onCancel }: ReportFormActionsProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p role="alert" className="min-h-5 text-sm text-destructive">
        {error}
      </p>
      <div className="flex items-center gap-2">
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel} disabled={isPending}>
            إلغاء
          </Button>
        )}
        <Button type="submit" disabled={isPending} className="min-w-32">
          {isPending ? 'جاري الحفظ…' : isEdit ? 'حفظ التغييرات' : 'إنشاء الضبط'}
        </Button>
      </div>
    </div>
  );
}
