import { Fragment } from 'react';
import { DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';

/** `copy` is the number printed in the PDF header; undefined uses the template's copy label. */
const PRINT_COPIES: { copy?: number; label: string }[] = [
  { label: 'حسب النموذج' },
  { copy: 1, label: 'النسخة الأولى' },
  { copy: 2, label: 'النسخة الثانية' },
  { copy: 3, label: 'النسخة الثالثة' },
];

/** Menu items for printing a report's ورقة ضبط as a given copy. */
export function PrintCopyMenuItems({ onPrint }: { onPrint: (copy?: number) => void }) {
  return (
    <>
      {PRINT_COPIES.map(({ copy, label }) => (
        <Fragment key={label}>
          <DropdownMenuItem onSelect={() => onPrint(copy)}>{label}</DropdownMenuItem>
          {copy === undefined && <DropdownMenuSeparator />}
        </Fragment>
      ))}
    </>
  );
}
