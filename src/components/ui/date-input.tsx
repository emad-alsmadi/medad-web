import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent, KeyboardEvent } from 'react';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { formatDate, parseDisplayDate, parseIsoDate, toIsoDate } from '@/lib/utils/date';

const MONTH_FORMAT = new Intl.DateTimeFormat('ar-SY-u-nu-latn', { month: 'long', year: 'numeric' });
const DAY_LABEL_FORMAT = new Intl.DateTimeFormat('ar-SY-u-nu-latn', { dateStyle: 'full' });
/** Starting from Saturday, the first day of the week here. */
const WEEKDAYS = ['سبت', 'أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة'];
const ARABIC_DIGITS = /[٠-٩]/g;

interface DateInputProps {
  id?: string;
  /** ISO `yyyy-mm-dd`, or '' for no date. */
  value: string | null | undefined;
  onChange: (value: string) => void;
  onBlur?: () => void;
  /** ISO bounds, inclusive. */
  min?: string;
  max?: string;
  disabled?: boolean;
  className?: string;
  'aria-invalid'?: boolean;
  /** Shown when a typed date falls outside min/max; defaults to naming the bound. */
  rangeErrorMessage?: string;
  /**
   * The form's own error for this field (e.g. «required»). Shown under the field unless what was
   * typed explains the problem better, so only one message appears.
   */
  error?: string;
}

/** Keeps the digits of what was typed and lays them out as dd/mm/yyyy. */
function maskTyped(raw: string): string {
  const digits = raw
    .replace(ARABIC_DIGITS, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/\D/g, '')
    .slice(0, 8);
  return [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4)].filter(Boolean).join('/');
}

function toIso(date: Date): string {
  return toIsoDate({ year: date.getFullYear(), month: date.getMonth() + 1, day: date.getDate() });
}

function fromIso(value: string | null | undefined): Date | null {
  const parts = parseIsoDate(value);
  return parts ? new Date(parts.year, parts.month - 1, parts.day) : null;
}

function inRange(iso: string, min?: string, max?: string): boolean {
  return (!min || iso >= min) && (!max || iso <= max);
}

/** Why a fully typed date can't be taken, or null when it can (or isn't complete yet). */
function typedDateError(text: string, min?: string, max?: string, rangeMessage?: string) {
  if (text.length < 10) return null;
  const parts = parseDisplayDate(text);
  if (!parts) return 'تاريخ غير صالح';
  const iso = toIsoDate(parts);
  if (inRange(iso, min, max)) return null;
  if (rangeMessage) return rangeMessage;
  return max && iso > max
    ? `يجب ألا يتجاوز التاريخ ${formatDate(max)}`
    : `يجب ألا يسبق التاريخ ${formatDate(min)}`;
}

/**
 * A date field that always reads day first (dd/mm/yyyy), whatever the browser's language — unlike
 * a native date input. Type the date, or pick it from the calendar; the value stays ISO.
 */
export function DateInput({
  id,
  value,
  onChange,
  onBlur,
  min,
  max,
  disabled,
  className,
  'aria-invalid': ariaInvalid,
  rangeErrorMessage,
  error,
}: DateInputProps) {
  const [text, setText] = useState(() => formatDate(value));
  const [open, setOpen] = useState(false);
  const typedError = typedDateError(text, min, max, rangeErrorMessage);
  // A half-typed date leaves the value empty, so the form's «required» would mislead.
  const isIncomplete = text !== '' && text.length < 10;
  const shownError =
    typedError ?? (error && isIncomplete ? 'أكمل التاريخ بالصيغة يوم/شهر/سنة' : error);
  const errorId = id ? `${id}-typed-error` : undefined;
  // Set when a rejected date clears the value, so that echo doesn't wipe the text showing why.
  const keepTextOnSync = useRef(false);

  // Follow a value set from outside (a reset, a quick range) without touching one being typed.
  useEffect(() => {
    if (keepTextOnSync.current) {
      keepTextOnSync.current = false;
      return;
    }
    const typed = parseDisplayDate(text);
    if ((typed ? toIsoDate(typed) : '') !== (value ?? '')) setText(formatDate(value));
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const next = maskTyped(e.target.value);
    setText(next);
    if (!next) {
      onChange('');
      return;
    }
    const parts = parseDisplayDate(next);
    if (parts && inRange(toIsoDate(parts), min, max)) {
      onChange(toIsoDate(parts));
    } else if (typedDateError(next, min, max) && value) {
      // Like a native date input: a rejected date leaves the field empty, not on its old value.
      keepTextOnSync.current = true;
      onChange('');
    }
  };

  const pick = (iso: string) => {
    setText(formatDate(iso));
    onChange(iso);
    setOpen(false);
  };

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Anchor asChild>
        <div className="relative">
          <input
            id={id}
            dir="ltr"
            inputMode="numeric"
            autoComplete="off"
            placeholder="يوم/شهر/سنة"
            value={text}
            disabled={disabled}
            aria-invalid={ariaInvalid || Boolean(typedError)}
            onChange={handleChange}
            aria-describedby={shownError ? errorId : undefined}
            // Drop a half-typed date rather than leave it showing beside the old value; a
            // rejected full date stays, with its reason, so it isn't silently undone.
            onBlur={() => {
              if (!typedError) setText(formatDate(value));
              onBlur?.();
            }}
            className={cn(
              'hover:border-syid-gold-dark/40 flex h-[2.625rem] w-full rounded-md border border-input bg-card py-2 pl-11 pr-3.5 text-right text-sm tabular-nums text-foreground shadow-none transition-all duration-syid ease-out placeholder:text-muted-foreground focus-visible:border-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15 disabled:cursor-not-allowed disabled:bg-background disabled:opacity-85 aria-[invalid=true]:border-destructive aria-[invalid=true]:focus-visible:ring-destructive/15',
              className,
            )}
          />
          <PopoverPrimitive.Trigger
            type="button"
            disabled={disabled}
            aria-label="اختيار التاريخ من التقويم"
            className="absolute inset-y-0 left-1 my-auto flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:pointer-events-none"
          >
            <CalendarDays className="h-4 w-4" />
          </PopoverPrimitive.Trigger>
        </div>
      </PopoverPrimitive.Anchor>
      {shownError && (
        <p id={errorId} role="alert" className="mt-1.5 text-sm text-destructive">
          {shownError}
        </p>
      )}
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="start"
          sideOffset={8}
          // Start on the selected (or today's) day rather than the month buttons.
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            (e.currentTarget as HTMLElement)
              .querySelector<HTMLButtonElement>('[data-day][tabindex="0"]')
              ?.focus();
          }}
          className="z-[1100] w-72 rounded-xl border border-border bg-card p-3 text-card-foreground shadow-syid-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
        >
          <Calendar value={value} min={min} max={max} onPick={pick} onClear={() => pick('')} />
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}

interface CalendarProps {
  value: string | null | undefined;
  min?: string;
  max?: string;
  onPick: (iso: string) => void;
  onClear: () => void;
}

/** A month grid, Saturday first; arrow keys move between days (left is later, as the page is right to left). */
function Calendar({ value, min, max, onPick, onClear }: CalendarProps) {
  const selected = value ?? '';
  const today = toIso(new Date());
  const [focused, setFocused] = useState(() => fromIso(value) ?? new Date());
  const gridRef = useRef<HTMLDivElement>(null);
  const moved = useRef(false);

  // Keep keyboard focus on the focused day as it moves (not on first open: Radix focuses it then).
  useEffect(() => {
    if (!moved.current) return;
    gridRef.current?.querySelector<HTMLButtonElement>('[data-day][tabindex="0"]')?.focus();
  }, [focused]);

  const year = focused.getFullYear();
  const month = focused.getMonth();
  // Saturday is 6 in getDay(); count the blank cells before the 1st from there.
  const lead = (new Date(year, month, 1).getDay() + 1) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1));

  const move = (next: Date) => {
    moved.current = true;
    setFocused(next);
  };
  const shiftMonth = (by: number) => {
    const next = new Date(year, month + by, 1);
    const lastDay = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
    setFocused(new Date(next.getFullYear(), next.getMonth(), Math.min(focused.getDate(), lastDay)));
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    const step = { ArrowLeft: 1, ArrowRight: -1, ArrowDown: 7, ArrowUp: -7 }[e.key];
    if (step === undefined) return;
    e.preventDefault();
    move(new Date(year, month, focused.getDate() + step));
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <button
          type="button"
          aria-label="الشهر السابق"
          onClick={() => shiftMonth(-1)}
          className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
        <p className="text-sm font-semibold" aria-live="polite">
          {MONTH_FORMAT.format(focused)}
        </p>
        <button
          type="button"
          aria-label="الشهر التالي"
          onClick={() => shiftMonth(1)}
          className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      </div>
      <div className="grid grid-cols-7 text-center text-[0.6875rem] font-medium text-muted-foreground">
        {WEEKDAYS.map((d) => (
          <span key={d} className="py-1">
            {d}
          </span>
        ))}
      </div>
      <div ref={gridRef} className="grid grid-cols-7 gap-0.5">
        {Array.from({ length: lead }, (_, i) => (
          <span key={`lead-${i}`} />
        ))}
        {days.map((day) => {
          const iso = toIso(day);
          const isSelected = iso === selected;
          const isFocused = day.getDate() === focused.getDate();
          return (
            <button
              key={iso}
              type="button"
              tabIndex={isFocused ? 0 : -1}
              disabled={!inRange(iso, min, max)}
              aria-pressed={isSelected}
              aria-label={DAY_LABEL_FORMAT.format(day)}
              onClick={() => onPick(iso)}
              onKeyDown={handleKeyDown}
              data-day
              onFocus={() => {
                if (!isFocused) setFocused(day);
              }}
              className={cn(
                'flex h-9 items-center justify-center rounded-md text-sm tabular-nums transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:pointer-events-none disabled:opacity-35',
                iso === today &&
                  !isSelected &&
                  'font-semibold text-primary ring-1 ring-inset ring-primary/40',
                isSelected && 'bg-primary font-semibold text-primary-foreground hover:bg-primary',
              )}
            >
              {day.getDate()}
            </button>
          );
        })}
      </div>
      <div className="flex items-center justify-between border-t border-border pt-2">
        <button
          type="button"
          disabled={!inRange(today, min, max)}
          onClick={() => onPick(today)}
          className="rounded-md px-2 py-1 text-xs font-medium text-primary transition-colors hover:bg-accent disabled:pointer-events-none disabled:opacity-40"
        >
          اليوم
        </button>
        <button
          type="button"
          onClick={onClear}
          className="rounded-md px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          مسح
        </button>
      </div>
    </div>
  );
}
