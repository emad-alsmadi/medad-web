import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query/query-keys';
import { children, get, list, roots, tree } from '@/lib/report-types/api';
import type { ReportTypeResponse } from '@/types/report-type';

export function useReportTypes() {
  return useQuery({
    queryKey: queryKeys.reportTypes.list(),
    queryFn: list,
  });
}

export function useReportTypesTree() {
  return useQuery({
    queryKey: queryKeys.reportTypes.tree(),
    queryFn: tree,
  });
}

export function useReportTypeRoots() {
  return useQuery({
    queryKey: queryKeys.reportTypes.roots(),
    queryFn: roots,
  });
}

export function useReportTypeChildren(id: number | null) {
  return useQuery({
    queryKey: queryKeys.reportTypes.children(id ?? -1),
    queryFn: () => children(id as number),
    enabled: id !== null,
  });
}

/** Walks a type's parentId chain up to the root, returning [root, ..., leaf]. */
async function fetchAncestorChain(id: number): Promise<ReportTypeResponse[]> {
  const chain: ReportTypeResponse[] = [];
  let current: number | undefined = id;
  while (current !== undefined) {
    const type = await get(current);
    chain.unshift(type);
    current = type.parentId;
  }
  return chain;
}

/** For pre-filling a cascading type select from a known leaf id (e.g. editing an existing report). */
export function useReportTypeAncestorChain(id: number | null) {
  return useQuery({
    queryKey: ['reportTypes', 'ancestorChain', id ?? -1] as const,
    queryFn: () => fetchAncestorChain(id as number),
    enabled: id !== null,
  });
}
