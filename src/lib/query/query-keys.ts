/**
 * Centralized react-query key factory, namespaced by domain. Prevents
 * key collisions/typos and makes cache invalidation
 * (queryClient.invalidateQueries) predictable across the app.
 *
 * Usage: queryKeys.reports.list({ page: 0 })
 */
export const queryKeys = {
  auth: {
    /** The signed-in user's AuthUser (role + permissions), kept in sync with /users/me. */
    session: ['auth', 'session'] as const,
  },
  users: {
    all: ['users'] as const,
    list: () => ['users', 'list'] as const,
    detail: (id: number) => ['users', 'detail', id] as const,
    me: ['users', 'me'] as const,
  },
  roles: {
    all: ['roles'] as const,
    list: () => ['roles', 'list'] as const,
    options: () => ['roles', 'options'] as const,
  },
  formTypes: {
    all: ['formTypes'] as const,
    list: () => ['formTypes', 'list'] as const,
    tree: () => ['formTypes', 'tree'] as const,
    roots: () => ['formTypes', 'roots'] as const,
    detail: (id: number) => ['formTypes', 'detail', id] as const,
    children: (id: number) => ['formTypes', 'children', id] as const,
    ancestorChain: (id: number) => ['formTypes', 'ancestorChain', id] as const,
  },
  crimeTypes: {
    all: ['crimeTypes'] as const,
    list: () => ['crimeTypes', 'list'] as const,
  },
  reports: {
    all: ['reports'] as const,
    list: (params?: object) => ['reports', 'list', params] as const,
    detail: (id: number) => ['reports', 'detail', id] as const,
    options: () => ['reports', 'options'] as const,
    statistics: (range?: Record<string, unknown>) => ['reports', 'statistics', range] as const,
  },
  reportTemplates: {
    all: ['reportTemplates'] as const,
    list: () => ['reportTemplates', 'list'] as const,
    detail: (formTypeId: number) => ['reportTemplates', 'detail', formTypeId] as const,
  },
} as const;
