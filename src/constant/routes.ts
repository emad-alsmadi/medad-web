/**
 * Centralized route path constants. Import these instead of hardcoding
 * path strings in <Link>/navigate() calls.
 */
export const ROUTES = {
  home: '/',
  login: '/login',
  admin: {
    users: '/admin/users',
  },
  reportTypes: {
    list: '/report-types',
    tree: '/report-types/tree',
  },
  reports: {
    list: '/reports',
    create: '/reports/new',
    detail: (id: number | string) => `/reports/${id}`,
    edit: (id: number | string) => `/reports/${id}/edit`,
  },
} as const;
