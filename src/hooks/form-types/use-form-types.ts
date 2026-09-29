import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query/query-keys';
import { children, get, list, roots, tree } from '@/lib/form-types/api';
import type { FormTypeResponse } from '@/types/form-type';

/** `enabled: false` for users without FORM_TYPES:VIEW, who'd only get a 403. */
export function useFormTypes({ enabled = true }: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: queryKeys.formTypes.list(),
    queryFn: list,
    enabled,
  });
}

export function useFormTypesTree() {
  return useQuery({
    queryKey: queryKeys.formTypes.tree(),
    queryFn: tree,
  });
}

export function useFormTypeRoots() {
  return useQuery({
    queryKey: queryKeys.formTypes.roots(),
    queryFn: roots,
  });
}

export function useFormTypeChildren(id: number | null) {
  return useQuery({
    queryKey: queryKeys.formTypes.children(id ?? -1),
    queryFn: () => children(id as number),
    enabled: id !== null,
  });
}

/** Walks a type's parentId chain up to the root, returning [root, ..., leaf]. */
async function fetchAncestorChain(id: number): Promise<FormTypeResponse[]> {
  const chain: FormTypeResponse[] = [];
  let current: number | undefined = id;
  while (current !== undefined) {
    const type = await get(current);
    chain.unshift(type);
    current = type.parentId;
  }
  return chain;
}

/** For pre-filling a cascading type select from a known leaf id (e.g. editing an existing report). */
export function useFormTypeAncestorChain(id: number | null) {
  return useQuery({
    queryKey: queryKeys.formTypes.ancestorChain(id ?? -1),
    queryFn: () => fetchAncestorChain(id as number),
    enabled: id !== null,
  });
}
