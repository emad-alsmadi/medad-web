import { Button } from '@/components/ui/button';

interface PaginationProps {
  /** 0-based current page number, matching the backend's Page<T> contract. */
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  isFetching?: boolean;
}

export function Pagination({ page, totalPages, onPageChange, isFetching }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between pt-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => onPageChange(Math.max(0, page - 1))}
        disabled={page <= 0 || isFetching}
      >
        السابق
      </Button>
      <span className="text-sm text-muted-foreground">
        صفحة {page + 1} من {totalPages}
      </span>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => onPageChange(Math.min(totalPages - 1, page + 1))}
        disabled={page >= totalPages - 1 || isFetching}
      >
        التالي
      </Button>
    </div>
  );
}
