/**
 * Centralized react-query key factory, namespaced by role/domain.
 * Prevents key collisions/typos and makes cache invalidation
 * (queryClient.invalidateQueries) predictable across the app.
 *
 * Usage: queryKeys.admin.users.list({ page: 1 })
 */
export const queryKeys = {
  admin: {
    users: {
      all: ['admin', 'users'] as const,
      list: (params?: Record<string, unknown>) => ['admin', 'users', 'list', params] as const,
      detail: (id: string) => ['admin', 'users', 'detail', id] as const,
    },
    dashboard: {
      summary: ['admin', 'dashboard', 'summary'] as const,
    },
  },
  auth: {
    session: ['auth', 'session'] as const,
  },
} as const;
