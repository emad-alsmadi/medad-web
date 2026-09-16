import { useMemo, useState } from 'react';

const DEFAULT_PAGE_SIZE = 10;

/**
 * Paginates an already-fully-fetched array on the client, for endpoints
 * with no server-side page/size support (e.g. GET /report-types, GET
 * /users). Resets to page 0 whenever the source array identity changes
 * (a new fetch/filter), so a stale page number is never left pointing
 * past the end of a shorter list.
 */
export function useClientPagination<T>(items: T[], pageSize: number = DEFAULT_PAGE_SIZE) {
  const [page, setPage] = useState(0);

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(page, totalPages - 1);

  const pageItems = useMemo(
    () => items.slice(safePage * pageSize, safePage * pageSize + pageSize),
    [items, safePage, pageSize],
  );

  return { page: safePage, totalPages, pageItems, setPage };
}
