import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useWatch } from 'react-hook-form';
import type { Control } from 'react-hook-form';
import type { LucideIcon } from 'lucide-react';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { REPORT_SECTION_PROGRESS, countFilled } from '@/components/reports/report-form-schema';
import type { ReportFormValues, ReportSectionKey } from '@/components/reports/report-form-schema';

export interface ReportSectionMeta {
  key: ReportSectionKey;
  title: string;
  hint: string;
  icon: LucideIcon;
  /** Whether its fields are required; required sections never collapse. */
  required?: boolean;
}

const NUMBER_FORMAT = new Intl.NumberFormat('ar-SY-u-nu-latn');

const sectionDomId = (key: ReportSectionKey) => `report-section-${key}`;

/** px below the top of the scroll area where a section counts as the one being read. */
const ACTIVATION_LINE = 80;

/** The nearest scrolling ancestor, or null when the page itself scrolls. */
function scrollParent(element: HTMLElement): HTMLElement | null {
  for (let node = element.parentElement; node; node = node.parentElement) {
    const { overflowY } = getComputedStyle(node);
    if ((overflowY === 'auto' || overflowY === 'scroll') && node.scrollHeight > node.clientHeight) {
      return node;
    }
  }
  return null;
}

interface SectionStatusProps {
  control: Control<ReportFormValues>;
  section: ReportSectionMeta;
  hasError: boolean;
  className?: string;
}

/**
 * A section's one-line state: its errors, else how much of it is filled.
 * Watches only its own fields, so typing elsewhere doesn't re-render it.
 */
function SectionStatus({ control, section, hasError, className }: SectionStatusProps) {
  const { fields, total } = REPORT_SECTION_PROGRESS[section.key];
  const filled = countFilled(useWatch({ control, name: fields }));

  if (hasError) {
    return <span className={cn('text-xs font-medium text-destructive', className)}>يحتوي أخطاء</span>;
  }
  if (section.required && filled === total) {
    return (
      <span className={cn('inline-flex items-center gap-1 text-xs text-primary', className)}>
        <Check className="h-3.5 w-3.5" aria-hidden="true" />
        مكتمل
      </span>
    );
  }
  if (filled === 0) {
    return (
      <span className={cn('text-xs text-muted-foreground', className)}>
        {section.required ? 'مطلوب' : 'اختياري'}
      </span>
    );
  }
  return (
    <span className={cn('text-xs text-muted-foreground', className)}>
      {NUMBER_FORMAT.format(filled)} من {NUMBER_FORMAT.format(total)}
      {section.required ? ' مطلوبة' : ''}
    </span>
  );
}

interface ReportFormSectionProps {
  control: Control<ReportFormValues>;
  section: ReportSectionMeta;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hasError: boolean;
  children: ReactNode;
}

/**
 * One form section as a light card. Optional sections collapse to their
 * header and a progress line; their fields stay mounted (only hidden) so
 * values and registrations survive collapsing.
 */
export function ReportFormSection({
  control,
  section,
  open,
  onOpenChange,
  hasError,
  children,
}: ReportFormSectionProps) {
  const Icon = section.icon;
  const headingId = `${sectionDomId(section.key)}-title`;
  const panelId = `${sectionDomId(section.key)}-panel`;
  const collapsible = !section.required;

  const heading = (
    <>
      <span
        className={cn(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl',
          hasError ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary',
        )}
      >
        <Icon className="h-[1.125rem] w-[1.125rem]" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1 text-start">
        <span id={headingId} className="block text-sm font-semibold text-foreground">
          {section.title}
        </span>
        <span className="block truncate text-xs text-muted-foreground">{section.hint}</span>
      </span>
      <SectionStatus control={control} section={section} hasError={hasError} className="shrink-0" />
    </>
  );

  return (
    <section
      id={sectionDomId(section.key)}
      aria-labelledby={headingId}
      className={cn(
        'scroll-mt-4 rounded-2xl border bg-card transition-colors',
        hasError ? 'border-destructive/40' : 'border-border-subtle',
      )}
    >
      {collapsible ? (
        <button
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => onOpenChange(!open)}
          className="flex w-full items-center gap-3 rounded-2xl px-5 py-4 transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15"
        >
          {heading}
          <ChevronDown
            className={cn(
              'h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-syid',
              open && 'rotate-180',
            )}
            aria-hidden="true"
          />
        </button>
      ) : (
        <div className="flex items-center gap-3 px-5 py-4">{heading}</div>
      )}
      <div id={panelId} hidden={!open} className="border-t border-border-subtle px-5 pb-5 pt-4">
        {children}
      </div>
    </section>
  );
}

interface ReportFormNavProps {
  control: Control<ReportFormValues>;
  sections: ReportSectionMeta[];
  errorSections: Set<ReportSectionKey>;
  onJump: (key: ReportSectionKey) => void;
}

/**
 * The section index beside the form (large screens): each section with
 * its live status, the one in view highlighted; clicking opens and
 * scrolls to it.
 */
export function ReportFormNav({ control, sections, errorSections, onJump }: ReportFormNavProps) {
  const [active, setActive] = useState<ReportSectionKey>(sections[0]!.key);

  // Until then, scrolling doesn't override a section picked in this index: its smooth
  // scroll may stop short of the top when little content follows it.
  const pickedUntil = useRef(0);

  // The active section is the one crossing a line just below the top of the scroll area
  // (the create dialog's body or the page) — or the last one at the very bottom, since a
  // short final section can never scroll up to that line.
  useEffect(() => {
    const placed = sections.flatMap((section) => {
      const element = document.getElementById(sectionDomId(section.key));
      return element ? [{ key: section.key, element }] : [];
    });
    if (placed.length === 0) return;

    let frame = 0;
    const update = () => {
      frame = 0;
      if (Date.now() < pickedUntil.current) return;
      // Looked up each time: the dialog body only starts scrolling once sections are opened.
      const scroller = scrollParent(placed[0]!.element);
      const box = scroller
        ? {
            top: scroller.getBoundingClientRect().top,
            height: scroller.clientHeight,
            scrolled: scroller.scrollTop,
            total: scroller.scrollHeight,
          }
        : {
            top: 0,
            height: window.innerHeight,
            scrolled: window.scrollY,
            total: document.documentElement.scrollHeight,
          };
      const canScroll = box.total > box.height + 2;
      const atBottom = canScroll && box.scrolled + box.height >= box.total - 2;
      let current = placed[0]!.key;
      for (const { key, element } of placed) {
        if (element.getBoundingClientRect().top - box.top <= ACTIVATION_LINE) current = key;
      }
      setActive(atBottom ? placed[placed.length - 1]!.key : current);
    };
    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };

    update();
    // Capture: scroll doesn't bubble, and this hears the page and the dialog body alike.
    document.addEventListener('scroll', schedule, { capture: true, passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      document.removeEventListener('scroll', schedule, { capture: true });
      window.removeEventListener('resize', schedule);
      window.cancelAnimationFrame(frame);
    };
  }, [sections]);

  return (
    <nav aria-label="أقسام الضبط">
      <ol className="space-y-1">
        {sections.map((section, index) => {
          const Icon = section.icon;
          const isActive = active === section.key;
          return (
            <li key={section.key}>
              <button
                type="button"
                aria-current={isActive ? 'step' : undefined}
                onClick={() => {
                  pickedUntil.current = Date.now() + 1000;
                  setActive(section.key);
                  onJump(section.key);
                }}
                className={cn(
                  'flex w-full items-start gap-2.5 rounded-xl px-3 py-2.5 text-start transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15',
                  isActive ? 'bg-primary/10' : 'hover:bg-muted/60',
                )}
              >
                <span
                  className={cn(
                    'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-xs font-semibold',
                    isActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
                  )}
                >
                  <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                  <span className="sr-only">{NUMBER_FORMAT.format(index + 1)}</span>
                </span>
                <span className="min-w-0">
                  <span
                    className={cn(
                      'block text-sm',
                      isActive ? 'font-semibold text-foreground' : 'text-foreground/80',
                    )}
                  >
                    {section.title}
                  </span>
                  <SectionStatus
                    control={control}
                    section={section}
                    hasError={errorSections.has(section.key)}
                  />
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
