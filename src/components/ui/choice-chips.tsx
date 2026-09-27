import { useRef } from 'react';
import type { KeyboardEvent } from 'react';
import { cn } from '@/lib/utils/cn';

export interface ChoiceChipOption {
  value: string;
  label: string;
}

interface ChoiceChipsProps {
  /** Id of the group; point a <label htmlFor> or aria-labelledby at it. */
  id: string;
  options: ChoiceChipOption[];
  value: string;
  onChange: (value: string) => void;
  'aria-labelledby'?: string;
  'aria-invalid'?: boolean;
  className?: string;
}

/**
 * A single-choice group rendered as pills (role="radiogroup") — lighter
 * than a dropdown for a handful of short options, and every choice stays
 * visible. Arrow keys move the selection, as in a native radio group.
 */
export function ChoiceChips({
  id,
  options,
  value,
  onChange,
  className,
  'aria-labelledby': labelledBy,
  'aria-invalid': invalid,
}: ChoiceChipsProps) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const selectedIndex = options.findIndex((o) => o.value === value);

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const rtl = getComputedStyle(event.currentTarget).direction === 'rtl';
    const next = { ArrowDown: 1, ArrowUp: -1, ArrowLeft: rtl ? 1 : -1, ArrowRight: rtl ? -1 : 1 }[
      event.key
    ];
    if (next === undefined) return;
    event.preventDefault();
    const target = (index + next + options.length) % options.length;
    onChange(options[target]!.value);
    refs.current[target]?.focus();
  }

  return (
    <div
      id={id}
      role="radiogroup"
      aria-labelledby={labelledBy}
      aria-invalid={invalid}
      className={cn('flex flex-wrap gap-2', className)}
    >
      {options.map((option, index) => {
        const checked = option.value === value;
        // Roving tabindex: only the selected chip (or the first, when none is) is tabbable.
        const tabbable = checked || (selectedIndex === -1 && index === 0);
        return (
          <button
            key={option.value}
            ref={(el) => {
              refs.current[index] = el;
            }}
            type="button"
            role="radio"
            aria-checked={checked}
            tabIndex={tabbable ? 0 : -1}
            onClick={() => onChange(option.value)}
            onKeyDown={(e) => onKeyDown(e, index)}
            className={cn(
              'h-9 rounded-full border px-3.5 text-sm font-medium transition-colors duration-syid focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15',
              checked
                ? 'border-primary bg-primary text-primary-foreground shadow-xs'
                : 'border-input bg-card text-foreground hover:border-syid-gold-dark/50 hover:bg-background',
              invalid && !checked && 'border-destructive/60',
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
