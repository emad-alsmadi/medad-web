import { useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

const DEFAULT_PAGE_SIZE = 10;

/**
 * Paginates an already-fully-fetched array on the client, for endpoints
 * with no server-side page/size support (e.g. GET /form-types, GET
 * /users). The page lives in `?page=` (0-based, like the reports list),
 * so a refresh or a shared link keeps it. A value that isn't a page of
 * the list (abc, past the end) is corrected in the URL once items exist.
 */
export function useClientPagination<T>(items: T[], pageSize: number = DEFAULT_PAGE_SIZE) {
  const [searchParams, setSearchParams] = useSearchParams();
  const raw = searchParams.get('page');
  const requested = raw === null ? 0 : Number(raw);
  const isWellFormed = Number.isInteger(requested) && requested >= 0;

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const page = isWellFormed ? Math.min(requested, totalPages - 1) : 0;

  const pageItems = useMemo(
    () => items.slice(page * pageSize, page * pageSize + pageSize),
    [items, page, pageSize],
  );

  const writePage = (next: number, replace: boolean) =>
    setSearchParams(
      (current) => {
        const params = new URLSearchParams(current);
        if (next > 0) params.set('page', String(next));
        else params.delete('page');
        return params;
      },
      { replace },
    );

  // An empty list may still be loading, so only a malformed value is fixed before items arrive.
  const needsFix = raw !== null && (!isWellFormed || (items.length > 0 && page !== requested));
  useEffect(() => {
    if (needsFix) writePage(page, true);
  }, [needsFix, page]); // eslint-disable-line react-hooks/exhaustive-deps

  const setPage = (next: number) => {
    if (next !== page) writePage(next, false);
  };

  return { page, totalPages, pageItems, setPage };
}
