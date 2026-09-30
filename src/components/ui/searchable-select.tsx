import { useEffect, useId, useMemo, useState } from 'react';
import type { KeyboardEvent } from 'react';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { Check, ChevronDown, Search } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { matchesSearch } from '@/lib/utils/text';

export interface SearchableSelectOption {
  value: string;
  label: string;
}

interface SearchableSelectProps {
  id?: string;
  /** undefined = nothing chosen. */
  value: string | undefined;
  onChange: (value: string | undefined) => void;
  options: SearchableSelectOption[];
  /** Listed first; choosing it clears the value (e.g. «جميع الجرائم»). Also the trigger text when empty. */
  emptyOptionLabel?: string;
  searchPlaceholder?: string;
  noResultsLabel?: string;
  disabled?: boolean;
}

interface Row {
  value: string | undefined;
  label: string;
}

/**
 * A select whose long option list can be narrowed by typing — spelling
 * variants (hamza, diacritics, Arabic digits) still match. Keyboard: type
 * to filter, ↑/↓/Home/End to move, Enter to choose, Escape to close.
 */
export function SearchableSelect({
  id,
  value,
  onChange,
  options,
  emptyOptionLabel,
  searchPlaceholder = 'اكتب للبحث…',
  noResultsLabel = 'لا توجد نتائج',
  disabled,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const listId = useId();

  const rows = useMemo<Row[]>(() => {
    const matching = options.filter((o) => matchesSearch(o.label, query));
    return emptyOptionLabel !== undefined && query.trim() === ''
      ? [{ value: undefined, label: emptyOptionLabel }, ...matching]
      : matching;
  }, [options, query, emptyOptionLabel]);

  const selected = options.find((o) => o.value === value);
  const optionId = (index: number) => `${listId}-option-${index}`;

  // Opening starts from an empty search with the current choice highlighted.
  useEffect(() => {
    if (!open) return;
    setQuery('');
    const index = rows.findIndex((row) => row.value === value);
    setActiveIndex(Math.max(index, 0));
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (open) document.getElementById(optionId(activeIndex))?.scrollIntoView({ block: 'nearest' });
  }, [open, activeIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  const choose = (row: Row | undefined) => {
    if (!row) return;
    onChange(row.value);
    setOpen(false);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    const last = rows.length - 1;
    const moves: Record<string, number> = {
      ArrowDown: Math.min(activeIndex + 1, last),
      ArrowUp: Math.max(activeIndex - 1, 0),
      Home: 0,
      End: last,
    };
    if (event.key in moves) {
      event.preventDefault();
      setActiveIndex(moves[event.key]!);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      choose(rows[activeIndex]);
    }
  };

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger
        id={id}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        className="hover:border-syid-gold-dark/50 flex h-[2.625rem] w-full items-center justify-between gap-2 rounded-xl border border-input bg-card px-3.5 py-2 text-sm font-medium text-foreground shadow-xs outline-none transition-all duration-syid ease-out hover:shadow-syid focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/15 disabled:cursor-not-allowed disabled:bg-background disabled:opacity-85 data-[state=open]:border-primary data-[state=open]:ring-4 data-[state=open]:ring-primary/15"
      >
        <span className="flex-1 truncate text-start">{selected?.label ?? emptyOptionLabel}</span>
        <ChevronDown
          aria-hidden="true"
          className={cn(
            'h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-syid',
            open && 'rotate-180',
          )}
        />
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="start"
          sideOffset={8}
          className="z-[1100] w-[var(--radix-popover-trigger-width)] min-w-56 overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-syid-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
        >
          <div className="relative border-b border-border-subtle p-1.5">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 end-4 my-auto h-4 w-4 text-muted-foreground"
            />
            <input
              role="combobox"
              aria-expanded="true"
              aria-controls={listId}
              aria-autocomplete="list"
              aria-activedescendant={rows[activeIndex] ? optionId(activeIndex) : undefined}
              aria-label={searchPlaceholder}
              placeholder={searchPlaceholder}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActiveIndex(0);
              }}
              onKeyDown={onKeyDown}
              className="h-9 w-full rounded-lg bg-transparent pe-8 ps-2.5 text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
          <ul
            id={listId}
            role="listbox"
            className="max-h-[min(20rem,var(--radix-popover-content-available-height))] overflow-y-auto p-1.5"
          >
            {rows.length === 0 && (
              <li
                role="presentation"
                className="px-2.5 py-3 text-center text-sm text-muted-foreground"
              >
                {noResultsLabel}
              </li>
            )}
            {rows.map((row, index) => {
              const isSelected = row.value === value;
              return (
                // Keyboard choice happens in the search box (aria-activedescendant); options never take focus.
                // eslint-disable-next-line jsx-a11y/click-events-have-key-events
                <li
                  key={row.value ?? ''}
                  id={optionId(index)}
                  role="option"
                  aria-selected={isSelected}
                  // Keeps focus in the search box, so typing can carry on.
                  onMouseDown={(e) => e.preventDefault()}
                  onMouseMove={() => setActiveIndex(index)}
                  onClick={() => choose(row)}
                  className={cn(
                    'relative flex cursor-pointer select-none items-center rounded-lg py-2 pe-2.5 ps-8 text-sm font-medium text-foreground',
                    index === activeIndex && 'bg-accent text-accent-foreground',
                    isSelected && 'text-primary',
                  )}
                >
                  {isSelected && (
                    <Check
                      aria-hidden="true"
                      className="absolute start-2.5 h-3.5 w-3.5 text-primary"
                    />
                  )}
                  {row.label}
                </li>
              );
            })}
          </ul>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
