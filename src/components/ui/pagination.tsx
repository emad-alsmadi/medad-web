import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';

interface PaginationProps {
  /** 0-based current page number, matching the backend's Page<T> contract. */
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  isFetching?: boolean;
}

const SIBLING_COUNT = 1;
const ELLIPSIS = 'ellipsis' as const;

/** Builds a 1-based page list with `ellipsis` markers, e.g. [1, 'ellipsis', 4, 5, 6, 'ellipsis', 12]. */
function buildPageList(currentPage: number, totalPages: number): (number | typeof ELLIPSIS)[] {
  const totalNumbersToShow = SIBLING_COUNT * 2 + 5; // first + last + current + 2 siblings + 2 ellipses
  if (totalPages <= totalNumbersToShow) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const leftSibling = Math.max(currentPage - SIBLING_COUNT, 1);
  const rightSibling = Math.min(currentPage + SIBLING_COUNT, totalPages);

  const showLeftEllipsis = leftSibling > 2;
  const showRightEllipsis = rightSibling < totalPages - 1;

  if (!showLeftEllipsis && showRightEllipsis) {
    const leftRange = Array.from({ length: 3 + SIBLING_COUNT * 2 }, (_, i) => i + 1);
    return [...leftRange, ELLIPSIS, totalPages];
  }

  if (showLeftEllipsis && !showRightEllipsis) {
    const rightRangeLength = 3 + SIBLING_COUNT * 2;
    const rightRange = Array.from(
      { length: rightRangeLength },
      (_, i) => totalPages - rightRangeLength + i + 1,
    );
    return [1, ELLIPSIS, ...rightRange];
  }

  const middleRange = Array.from(
    { length: rightSibling - leftSibling + 1 },
    (_, i) => leftSibling + i,
  );
  return [1, ELLIPSIS, ...middleRange, ELLIPSIS, totalPages];
}

export function Pagination({ page, totalPages, onPageChange, isFetching }: PaginationProps) {
  if (totalPages <= 1) return null;

  const currentPage = page + 1;
  const pageList = buildPageList(currentPage, totalPages);

  return (
    <nav aria-label="تصفح الصفحات" className="flex items-center justify-center gap-1 pt-2">
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-9 w-9"
        aria-label="الصفحة السابقة"
        onClick={() => onPageChange(Math.max(0, page - 1))}
        disabled={page <= 0 || isFetching}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>

      {pageList.map((item, i) =>
        item === ELLIPSIS ? (
          <span
            key={`ellipsis-${i}`}
            className="flex h-9 w-9 items-center justify-center text-sm text-muted-foreground"
            aria-hidden="true"
          >
            …
          </span>
        ) : (
          <Button
            key={item}
            type="button"
            variant="outline"
            size="icon"
            aria-label={`الصفحة ${item}`}
            aria-current={item === currentPage ? 'page' : undefined}
            className={cn(
              'h-9 w-9 border-input',
              item === currentPage &&
                'border-transparent bg-primary text-primary-foreground shadow-syid hover:bg-syid-forest-dark hover:text-primary-foreground',
            )}
            onClick={() => onPageChange(item - 1)}
            disabled={isFetching}
          >
            {item}
          </Button>
        ),
      )}

      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-9 w-9"
        aria-label="الصفحة التالية"
        onClick={() => onPageChange(Math.min(totalPages - 1, page + 1))}
        disabled={page >= totalPages - 1 || isFetching}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
    </nav>
  );
}
