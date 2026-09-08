/**
 * Centralized react-query key factory, namespaced by domain. Prevents
 * key collisions/typos and makes cache invalidation
 * (queryClient.invalidateQueries) predictable across the app.
 *
 * Usage: queryKeys.reports.list({ page: 0 })
 */
export const queryKeys = {
  auth: {
    session: ['auth', 'session'] as const,
  },
  users: {
    all: ['users'] as const,
    list: () => ['users', 'list'] as const,
    detail: (id: string) => ['users', 'detail', id] as const,
    me: ['users', 'me'] as const,
  },
  reportTypes: {
    all: ['reportTypes'] as const,
    list: () => ['reportTypes', 'list'] as const,
    tree: () => ['reportTypes', 'tree'] as const,
    detail: (id: number) => ['reportTypes', 'detail', id] as const,
    children: (id: number) => ['reportTypes', 'children', id] as const,
  },
  reports: {
    all: ['reports'] as const,
    list: (params?: Record<string, unknown>) => ['reports', 'list', params] as const,
    detail: (id: number) => ['reports', 'detail', id] as const,
  },
} as const;
