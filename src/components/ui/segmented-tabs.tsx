import type { KeyboardEvent, ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';

export interface SegmentedTab {
  value: string;
  label: string;
  /** Small marker after the label, e.g. a "filled" check. */
  adornment?: ReactNode;
  invalid?: boolean;
}

interface SegmentedTabsProps {
  /** Prefix for the tab/panel ids: tabs are `${idPrefix}-tab-${value}`, panels `${idPrefix}-panel-${value}`. */
  idPrefix: string;
  label: string;
  tabs: SegmentedTab[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

/**
 * A compact tab strip (role="tablist") for switching between sibling
 * panels in place. The caller renders the panels with
 * `role="tabpanel"`, the matching ids, and `hidden` when inactive.
 */
export function SegmentedTabs({
  idPrefix,
  label,
  tabs,
  value,
  onChange,
  className,
}: SegmentedTabsProps) {
  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const rtl = getComputedStyle(event.currentTarget).direction === 'rtl';
    const step = { ArrowLeft: rtl ? 1 : -1, ArrowRight: rtl ? -1 : 1 }[event.key];
    if (step === undefined) return;
    event.preventDefault();
    const next = tabs[(index + step + tabs.length) % tabs.length]!;
    onChange(next.value);
    document.getElementById(`${idPrefix}-tab-${next.value}`)?.focus();
  }

  return (
    <div
      role="tablist"
      aria-label={label}
      className={cn(
        'inline-flex max-w-full flex-wrap gap-1 rounded-xl border border-border-subtle bg-muted/50 p-1',
        className,
      )}
    >
      {tabs.map((tab, index) => {
        const selected = tab.value === value;
        return (
          <button
            key={tab.value}
            id={`${idPrefix}-tab-${tab.value}`}
            type="button"
            role="tab"
            aria-selected={selected}
            aria-controls={`${idPrefix}-panel-${tab.value}`}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(tab.value)}
            onKeyDown={(e) => onKeyDown(e, index)}
            className={cn(
              'inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-sm font-medium transition-colors duration-syid focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15',
              selected
                ? 'bg-card text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground',
              tab.invalid && 'text-destructive',
            )}
          >
            {tab.label}
            {tab.invalid ? (
              <span className="h-1.5 w-1.5 rounded-full bg-destructive" aria-label="يحتوي خطأ" />
            ) : (
              tab.adornment
            )}
          </button>
        );
      })}
    </div>
  );
}
